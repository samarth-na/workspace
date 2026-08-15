import type {
  ConversationsResponse,
  CreateDmResponse,
  CreateGroupInput,
  CreateGroupResponse,
  MessagesResponse,
  SendMessageInput,
  SendMessageResponse,
  ToggleReactionResponse,
  UsersResponse,
} from "@/lib/chat-types";

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string") return data.error;
  } catch {
    // response body is not JSON
  }
  return `Request failed with status ${response.status}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as T;
}

export function fetchConversations(): Promise<ConversationsResponse> {
  return request<ConversationsResponse>("/api/chat/conversations");
}

export function fetchMessages(
  conversationId: string,
  before?: number,
  limit = 50,
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (before !== undefined) {
    params.set("before", String(before));
  }
  return request<MessagesResponse>(
    `/api/chat/conversations/${conversationId}/messages?${params.toString()}`,
  );
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/read`,
    { method: "POST" },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export function sendMessageRest(
  payload: SendMessageInput,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function toggleReactionRest(
  messageId: string,
  emoji: string,
): Promise<ToggleReactionResponse> {
  return request<ToggleReactionResponse>(
    `/api/chat/messages/${messageId}/reactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    },
  );
}

export function createDm(userId: string): Promise<CreateDmResponse> {
  return request<CreateDmResponse>("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export function createGroup(
  payload: CreateGroupInput,
): Promise<CreateGroupResponse> {
  return request<CreateGroupResponse>("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function searchUsers(q: string): Promise<UsersResponse> {
  return request<UsersResponse>(`/api/chat/users?q=${encodeURIComponent(q)}`);
}

export function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  const day = new Date(epochMs);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (dayDiff === 1) return "Yesterday";
  return day.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
