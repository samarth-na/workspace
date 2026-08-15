import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  MessageReaction,
  ServerEvent,
} from "@/lib/chat-types";

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

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

let socket: ChatSocket | null = null;

export function getChatSocket(): ChatSocket {
  if (socket === null) {
    socket = io(WS_URL, { autoConnect: true }) as ChatSocket;
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
