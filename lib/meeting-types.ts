import type { AvatarUser } from "@/lib/chat-types";

export type MeetingStatus = "scheduled" | "live" | "ended";

export type MeetingSummary = {
  id: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  host: AvatarUser | null;
  startsAt: number;
  endsAt: number | null;
  members: AvatarUser[];
  isHost: boolean;
  isMember: boolean;
};

export type MeetingsResponse = {
  meetings: MeetingSummary[];
  isPreview: boolean;
  isAdmin: boolean;
};

export type MeetingNote = {
  id: string;
  content: string;
  author: AvatarUser;
  createdAt: number;
};

export type MeetingNotesResponse = {
  notes: MeetingNote[];
};

export type MeetingNoteInput = {
  content: string;
};

export type MeetingAssigneesInput = {
  memberIds: string[];
};

export type MeetingResponse = {
  meeting: MeetingSummary;
  me: { name: string; isSignedIn: boolean } | null;
};

export type CreateMeetingInput = {
  title: string;
  description?: string;
  startsAt?: string;
  memberIds: string[];
};

export type CreateMeetingResponse = {
  meetingId: string;
};

export type MeetingPeer = {
  peerId: string;
  userId: string | null;
  name: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type MeetingPeerState = {
  peerId: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type MeetingSignalDescription = RTCSessionDescriptionInit;

export type MeetingIceCandidate = RTCIceCandidateInit;

export type MeetingJoinInput = {
  meetingId: string;
  name: string;
  muted: boolean;
  cameraOn: boolean;
};

export type MeetingStateInput = {
  meetingId: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type MeetingSignalInput = {
  meetingId: string;
  peerId: string;
  description?: MeetingSignalDescription;
  candidate?: MeetingIceCandidate;
};
