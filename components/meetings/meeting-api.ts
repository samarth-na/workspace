import type {
  CreateMeetingInput,
  CreateMeetingResponse,
  MeetingAssigneesInput,
  MeetingNote,
  MeetingNotesResponse,
  MeetingResponse,
  MeetingsResponse,
} from "@/lib/meeting-types";

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

export function fetchMeetings(): Promise<MeetingsResponse> {
  return request<MeetingsResponse>("/api/meetings");
}

export function fetchMeeting(meetingId: string): Promise<MeetingResponse> {
  return request<MeetingResponse>(`/api/meetings/${meetingId}`);
}

export function createMeeting(
  input: CreateMeetingInput,
): Promise<CreateMeetingResponse> {
  return request<CreateMeetingResponse>("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function joinMeeting(meetingId: string): Promise<MeetingResponse> {
  return request<MeetingResponse>(`/api/meetings/${meetingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join" }),
  });
}

export function endMeeting(meetingId: string): Promise<MeetingResponse> {
  return request<MeetingResponse>(`/api/meetings/${meetingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end" }),
  });
}

export function startMeeting(meetingId: string): Promise<MeetingResponse> {
  return request<MeetingResponse>(`/api/meetings/${meetingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start" }),
  });
}

export function fetchMeetingNotes(meetingId: string): Promise<MeetingNotesResponse> {
  return request<MeetingNotesResponse>(`/api/meetings/${meetingId}/notes`);
}

export function addMeetingNote(
  meetingId: string,
  content: string,
): Promise<{ note: MeetingNote }> {
  return request<{ note: MeetingNote }>(`/api/meetings/${meetingId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export function setMeetingAssignees(
  meetingId: string,
  input: MeetingAssigneesInput,
): Promise<MeetingResponse> {
  return request<MeetingResponse>(`/api/meetings/${meetingId}/assignees`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
