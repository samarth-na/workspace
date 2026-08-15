import { io, type Socket } from "socket.io-client";
import type {
  MeetingIceCandidate,
  MeetingPeer,
  MeetingPeerState,
  MeetingSignalDescription,
} from "@/lib/meeting-types";

type ClientToServerEvents = {
  "meeting:join-room": (payload: {
    meetingId: string;
    name: string;
    muted: boolean;
    cameraOn: boolean;
  }) => void;
  "meeting:leave-room": (payload: { meetingId: string }) => void;
  "meeting:state": (payload: {
    meetingId: string;
    muted: boolean;
    cameraOn: boolean;
    sharing: boolean;
  }) => void;
  "meeting:offer": (payload: {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:answer": (payload: {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:ice": (payload: {
    meetingId: string;
    peerId: string;
    candidate: MeetingIceCandidate;
  }) => void;
};

type ServerToClientEvents = {
  "meeting:peers": (payload: { peers: MeetingPeer[] }) => void;
  "meeting:peer-joined": (payload: { peer: MeetingPeer }) => void;
  "meeting:peer-left": (payload: { peerId: string }) => void;
  "meeting:peer-state": (payload: MeetingPeerState) => void;
  "meeting:offer": (payload: {
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:answer": (payload: {
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:ice": (payload: {
    peerId: string;
    candidate: MeetingIceCandidate;
  }) => void;
};

export type MeetingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

export function createMeetingSocket(): MeetingSocket {
  return io(WS_URL, { autoConnect: true }) as MeetingSocket;
}
