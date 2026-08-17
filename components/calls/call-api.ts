import type {
  CallResponse,
  CallsResponse,
  CreateCallInput,
  CreateCallResponse,
} from "@/lib/call-types";

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

export function fetchCalls(): Promise<CallsResponse> {
  return request<CallsResponse>("/api/calls");
}

export function fetchCall(callId: string): Promise<CallResponse> {
  return request<CallResponse>(`/api/calls/${callId}`);
}

export function createCall(
  input: CreateCallInput,
): Promise<CreateCallResponse> {
  return request<CreateCallResponse>("/api/calls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function joinCall(callId: string): Promise<CallResponse> {
  return request<CallResponse>(`/api/calls/${callId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join" }),
  });
}

export function endCall(callId: string): Promise<CallResponse> {
  return request<CallResponse>(`/api/calls/${callId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end" }),
  });
}

export function heartbeatCall(callId: string): Promise<void> {
  return request<void>(`/api/calls/${callId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "heartbeat" }),
  });
}
