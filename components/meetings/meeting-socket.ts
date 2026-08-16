import type {
  MeetingIceCandidate,
  MeetingPeer,
  MeetingPeerState,
  MeetingSignalDescription,
} from "@/lib/meeting-types";

const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8787";

type MeetingClientEvents = {
  "meeting:join-room": {
    meetingId: string;
    name: string;
    muted: boolean;
    cameraOn: boolean;
  };
  "meeting:leave-room": { meetingId: string };
  "meeting:state": {
    meetingId: string;
    muted: boolean;
    cameraOn: boolean;
    sharing: boolean;
  };
  "meeting:offer": {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  };
  "meeting:answer": {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  };
  "meeting:ice": {
    meetingId: string;
    peerId: string;
    candidate: MeetingIceCandidate;
  };
};

type MeetingServerEvents = {
  connect: Record<string, never>;
  disconnect: Record<string, never>;
  "meeting:peers": { peers: MeetingPeer[] };
  "meeting:peer-joined": { peer: MeetingPeer };
  "meeting:peer-left": { peerId: string };
  "meeting:peer-state": MeetingPeerState;
  "meeting:offer": { peerId: string; description: MeetingSignalDescription };
  "meeting:answer": { peerId: string; description: MeetingSignalDescription };
  "meeting:ice": { peerId: string; candidate: MeetingIceCandidate };
};

export type MeetingSocket = {
  on<K extends keyof MeetingServerEvents>(
    event: K,
    listener: (payload: MeetingServerEvents[K]) => void,
  ): void;
  emit<K extends keyof MeetingClientEvents>(
    event: K,
    payload: MeetingClientEvents[K],
  ): void;
  disconnect(): void;
};

type Listener = (payload: unknown) => void;

class RealtimeMeetingSocket implements MeetingSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private manuallyClosed = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;

  constructor(private readonly meetingId: string) {
    void this.open();
  }

  on<K extends keyof MeetingServerEvents>(
    event: K,
    listener: (payload: MeetingServerEvents[K]) => void,
  ): void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as Listener);
    this.listeners.set(event, listeners);
  }

  emit<K extends keyof MeetingClientEvents>(
    event: K,
    payload: MeetingClientEvents[K],
  ): void {
    if (this.ws !== null && this.ws.readyState === 1) {
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
      console.error("[meeting] realtime token failed:", err);
      this.scheduleReconnect();
      return;
    }
    if (this.manuallyClosed) return;

    const url = `${REALTIME_URL}?room=${encodeURIComponent(`meeting:${this.meetingId}`)}&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      this.dispatch("connect", {});
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
      this.dispatch("disconnect", {});
      this.ws = null;
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
        console.error(`[meeting] ${event} listener failed:`, err);
      }
    }
  }
}

export function createMeetingSocket(meetingId: string): MeetingSocket {
  return new RealtimeMeetingSocket(meetingId);
}
