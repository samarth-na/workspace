import type { AvatarUser } from "@/lib/chat-types";

export type CallStatus = "ringing" | "live" | "ended";

export type CallSummary = {
  id: string;
  status: CallStatus;
  host: AvatarUser | null;
  startedAt: number;
  endsAt: number | null;
  members: AvatarUser[];
  isHost: boolean;
  isMember: boolean;
};

export type CallsResponse = {
  calls: CallSummary[];
  isPreview: boolean;
  isAdmin: boolean;
};

export type CallResponse = {
  call: CallSummary;
  me: { name: string; isSignedIn: boolean } | null;
};

export type CreateCallInput = {
  memberIds: string[];
};

export type CreateCallResponse = {
  callId: string;
};

export type CallPeer = {
  peerId: string;
  userId: string | null;
  name: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type CallPeerState = {
  peerId: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type CallSignalDescription = RTCSessionDescriptionInit;

export type CallIceCandidate = RTCIceCandidateInit;

export type CallJoinInput = {
  callId: string;
  name: string;
  muted: boolean;
  cameraOn: boolean;
};

export type CallStateInput = {
  callId: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type CallSignalInput = {
  callId: string;
  peerId: string;
  description?: CallSignalDescription;
  candidate?: CallIceCandidate;
};
