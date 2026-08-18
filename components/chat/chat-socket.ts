import type {
  ChatMessage,
  MessageReaction,
  ServerEvent,
} from "@/lib/chat-types";
import { chatWebSocketUrl } from "@/lib/client-config";

type ClientToServerEvents = {
  "chat:join": (payload: { conversationIds: string[] }) => void;
  "message:send": (payload: {
    conversationId: string;
    body: string;
    clientId: string;
  }) => void;
  "reaction:toggle": (payload: {
    conversationId: string;
    messageId: string;
    emoji: string;
  }) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
};

type ServerToClientEvents = {
  connect: () => void;
  disconnect: () => void;
  "message:new": (payload: { message: ChatMessage }) => void;
  "message:sent": (payload: { clientId: string; message: ChatMessage }) => void;
  "message:failed": (payload: {
    clientId: string;
    conversationId: string;
    reason: string;
  }) => void;
  "reaction:update": (payload: {
    conversationId: string;
    messageId: string;
    reactions: MessageReaction[];
  }) => void;
  typing: (payload: {
    conversationId: string;
    userId: string;
    name: string;
  }) => void;
  "conversations:changed": (payload: Record<string, never>) => void;
};

type ServerEventName = keyof ServerToClientEvents;

type ChatSocket = {
  readonly connected: boolean;
  on<E extends ServerEventName>(
    event: E,
    listener: ServerToClientEvents[E],
  ): void;
  off<E extends ServerEventName>(
    event: E,
    listener: ServerToClientEvents[E],
  ): void;
  emit<E extends keyof ClientToServerEvents>(
    event: E,
    payload: Parameters<ClientToServerEvents[E]>[0],
  ): void;
};

type Listener = (payload: unknown) => void;

class RealtimeChatSocket implements ChatSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private joinedConversationIds = new Set<string>();
  private manuallyClosed = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private connectedValue = false;

  get connected(): boolean {
    return this.connectedValue;
  }

  constructor() {
    void this.open();
  }

  on<E extends ServerEventName>(
    event: E,
    listener: ServerToClientEvents[E],
  ): void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as Listener);
    this.listeners.set(event, listeners);
  }

  off<E extends ServerEventName>(
    event: E,
    listener: ServerToClientEvents[E],
  ): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    listeners.delete(listener as Listener);
    if (listeners.size === 0) this.listeners.delete(event);
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    payload: Parameters<ClientToServerEvents[E]>[0],
  ): void {
    if (event === "chat:join") {
      const conversationIds = (
        payload as { conversationIds: string[] }
      ).conversationIds.filter((id) => typeof id === "string");
      for (const id of conversationIds) {
        this.joinedConversationIds.add(id);
      }
    }
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, payload }));
    }
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private async open(): Promise<void> {
    let token: string;
    try {
      const response = await fetch("/api/realtime/token", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`token request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { token?: unknown };
      if (typeof data.token !== "string" || data.token.length === 0) {
        throw new Error("token response is invalid");
      }
      token = data.token;
    } catch (err) {
      console.error("[chat] realtime token failed:", err);
      this.scheduleReconnect();
      return;
    }
    if (this.manuallyClosed) return;

    const url = `${chatWebSocketUrl}?room=chat2&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      this.connectedValue = true;
      this.dispatch("connect", {});
      if (this.joinedConversationIds.size > 0) {
        this.ws?.send(
          JSON.stringify({
            type: "chat:join",
            payload: { conversationIds: [...this.joinedConversationIds] },
          }),
        );
      }
    };
    ws.onmessage = (event) => {
      let message: { type?: unknown; payload?: unknown };
      try {
        message = JSON.parse(String(event.data)) as {
          type?: unknown;
          payload?: unknown;
        };
      } catch {
        return;
      }
      if (typeof message.type !== "string") return;
      this.dispatch(message.type, message.payload);
    };
    ws.onclose = () => {
      this.connectedValue = false;
      this.ws = null;
      this.dispatch("disconnect", {});
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.retryTimer !== null) return;
    const delay = Math.min(1000 * 2 ** this.attempt, 10_000);
    this.attempt += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.open();
    }, delay);
  }

  private dispatch(event: string, payload: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[chat] ${event} listener failed:`, err);
      }
    }
  }
}

let socket: ChatSocket | null = null;

export function getChatSocket(): ChatSocket {
  if (socket === null) {
    socket = new RealtimeChatSocket();
  }
  return socket;
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export function sendChatMessage(payload: {
  conversationId: string;
  body: string;
  clientId: string;
}): void {
  getChatSocket().emit("message:send", payload);
}

export function toggleChatReaction(payload: {
  conversationId: string;
  messageId: string;
  emoji: string;
}): void {
  getChatSocket().emit("reaction:toggle", payload);
}

export function sendTyping(payload: {
  conversationId: string;
  isTyping: boolean;
}): void {
  getChatSocket().emit("typing", payload);
}

export function onServerEvent(
  listener: (event: ServerEvent) => void,
): () => void {
  const activeSocket = getChatSocket();
  const onMessageNew = (payload: { message: ChatMessage }) =>
    listener({ type: "message:new", payload: payload.message });
  const onMessageSent = (payload: { clientId: string; message: ChatMessage }) =>
    listener({ type: "message:sent", payload });
  const onMessageFailed = (payload: {
    clientId: string;
    conversationId: string;
    reason: string;
  }) => listener({ type: "message:failed", payload });
  const onReactionUpdate = (payload: {
    conversationId: string;
    messageId: string;
    reactions: MessageReaction[];
  }) => listener({ type: "reaction:update", payload });
  const onTyping = (payload: {
    conversationId: string;
    userId: string;
    name: string;
  }) => listener({ type: "typing", payload });
  const onConversationsChanged = (payload: Record<string, never>) =>
    listener({ type: "conversations:changed", payload });

  activeSocket.on("message:new", onMessageNew);
  activeSocket.on("message:sent", onMessageSent);
  activeSocket.on("message:failed", onMessageFailed);
  activeSocket.on("reaction:update", onReactionUpdate);
  activeSocket.on("typing", onTyping);
  activeSocket.on("conversations:changed", onConversationsChanged);

  return () => {
    activeSocket.off("message:new", onMessageNew);
    activeSocket.off("message:sent", onMessageSent);
    activeSocket.off("message:failed", onMessageFailed);
    activeSocket.off("reaction:update", onReactionUpdate);
    activeSocket.off("typing", onTyping);
    activeSocket.off("conversations:changed", onConversationsChanged);
  };
}
