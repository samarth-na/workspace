"use client";

import {
  ArrowLeft,
  Clock3,
  Copy,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Pin,
  PinOff,
  Presentation,
  Share2,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  endMeeting,
  fetchMeeting,
  joinMeeting,
} from "@/components/meetings/meeting-api";
import {
  createMeetingSocket,
  type MeetingSocket,
} from "@/components/meetings/meeting-socket";
import type {
  MeetingIceCandidate,
  MeetingPeer,
  MeetingSignalDescription,
  MeetingSummary,
} from "@/lib/meeting-types";
import { cn } from "@/lib/utils";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type PeerConnectionInfo = {
  pc: RTCPeerConnection;
  initiated: boolean;
};

type Controls = {
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

function MeetingRoom({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [peers, setPeers] = useState<MeetingPeer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [controls, setControls] = useState<Controls>({
    muted: false,
    cameraOn: true,
    sharing: false,
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showParticipants, setShowParticipants] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMedia, setHasMedia] = useState(true);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenPreviewRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pcsRef = useRef(new Map<string, PeerConnectionInfo>());
  const pendingIceRef = useRef(new Map<string, MeetingIceCandidate[]>());
  const socketRef = useRef<MeetingSocket | null>(null);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const startedAtRef = useRef<number>(Date.now());
  const nameRef = useRef("Guest");

  useEffect(() => {
    let cancelled = false;
    let socket: MeetingSocket | null = null;

    const emitOffer = (
      peerId: string,
      description: MeetingSignalDescription,
    ) => {
      socket?.emit("meeting:offer", { meetingId, peerId, description });
    };
    const emitAnswer = (
      peerId: string,
      description: MeetingSignalDescription,
    ) => {
      socket?.emit("meeting:answer", { meetingId, peerId, description });
    };
    const emitIce = (peerId: string, candidate: MeetingIceCandidate) => {
      socket?.emit("meeting:ice", { meetingId, peerId, candidate });
    };

    const clearPeer = (peerId: string) => {
      pcsRef.current.get(peerId)?.pc.close();
      pcsRef.current.delete(peerId);
      pendingIceRef.current.delete(peerId);
      setRemoteStreams((prev) => {
        if (!(peerId in prev)) return prev;
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    };

    const renegotiate = async (peerId: string, info: PeerConnectionInfo) => {
      try {
        const offer = await info.pc.createOffer();
        await info.pc.setLocalDescription(offer);
        if (info.pc.localDescription) {
          emitOffer(peerId, info.pc.localDescription);
        }
      } catch (err) {
        console.error("[meeting] renegotiate failed:", err);
      }
    };

    const addLocalTracks = (pc: RTCPeerConnection) => {
      const stream = localStreamRef.current;
      if (!stream) return;
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    };

    const createPeerConnection = (
      peerId: string,
      initiated: boolean,
    ): PeerConnectionInfo | null => {
      const existing = pcsRef.current.get(peerId);
      if (existing) return existing;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const info: PeerConnectionInfo = { pc, initiated };
      pcsRef.current.set(peerId, info);
      addLocalTracks(pc);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emitIce(peerId, event.candidate.toJSON());
        }
      };
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setRemoteStreams((prev) => {
          const existingStream = prev[peerId];
          if (
            existingStream &&
            existingStream.getVideoTracks()[0]?.id ===
              stream.getVideoTracks()[0]?.id
          ) {
            return prev;
          }
          return { ...prev, [peerId]: stream };
        });
      };
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          clearPeer(peerId);
        }
      };
      return info;
    };

    const connectToPeer = async (peerId: string) => {
      const info = createPeerConnection(peerId, true);
      if (!info) return;
      await renegotiate(peerId, info);
    };

    const flushPendingIce = (peerId: string, pc: RTCPeerConnection) => {
      const pending = pendingIceRef.current.get(peerId);
      if (!pending) return;
      for (const candidate of pending) {
        pc.addIceCandidate(candidate).catch(() => {});
      }
      pendingIceRef.current.delete(peerId);
    };

    socket = createMeetingSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      if (cancelled) return;
      setSocketConnected(true);
      const { muted, cameraOn } = controlsRef.current;
      socket?.emit("meeting:join-room", {
        meetingId,
        name: nameRef.current,
        muted,
        cameraOn,
      });
    });

    socket.on("disconnect", () => {
      if (!cancelled) setSocketConnected(false);
    });

    socket.on("meeting:peers", (payload) => {
      for (const info of pcsRef.current.values()) {
        info.pc.close();
      }
      pcsRef.current.clear();
      pendingIceRef.current.clear();
      setRemoteStreams({});
      setPeers(payload.peers);
      for (const peer of payload.peers) {
        void connectToPeer(peer.peerId);
      }
    });

    socket.on("meeting:peer-joined", (payload) => {
      setPeers((prev) =>
        prev.some((peer) => peer.peerId === payload.peer.peerId)
          ? prev
          : [...prev, payload.peer],
      );
    });

    socket.on("meeting:peer-left", (payload) => {
      setPeers((prev) => prev.filter((peer) => peer.peerId !== payload.peerId));
      setPinnedPeerId((prev) => (prev === payload.peerId ? null : prev));
      clearPeer(payload.peerId);
    });

    socket.on("meeting:peer-state", (payload) => {
      setPeers((prev) =>
        prev.map((peer) =>
          peer.peerId === payload.peerId ? { ...peer, ...payload } : peer,
        ),
      );
    });

    socket.on("meeting:offer", async (payload) => {
      let info: PeerConnectionInfo | null | undefined = pcsRef.current.get(
        payload.peerId,
      );
      const initiated = info?.initiated ?? false;
      if (info && initiated) return;
      if (!info) {
        info = createPeerConnection(payload.peerId, false);
      }
      if (!info) return;
      try {
        await info.pc.setRemoteDescription(
          payload.description as RTCSessionDescriptionInit,
        );
        flushPendingIce(payload.peerId, info.pc);
        const answer = await info.pc.createAnswer();
        await info.pc.setLocalDescription(answer);
        if (info.pc.localDescription) {
          emitAnswer(payload.peerId, info.pc.localDescription);
        }
      } catch (err) {
        console.error("[meeting] answer failed:", err);
      }
    });

    socket.on("meeting:answer", async (payload) => {
      const info = pcsRef.current.get(payload.peerId);
      if (!info) return;
      try {
        await info.pc.setRemoteDescription(
          payload.description as RTCSessionDescriptionInit,
        );
        flushPendingIce(payload.peerId, info.pc);
      } catch (err) {
        console.error("[meeting] accept answer failed:", err);
      }
    });

    socket.on("meeting:ice", async (payload) => {
      const info = pcsRef.current.get(payload.peerId);
      if (!info) return;
      try {
        if (info.pc.remoteDescription) {
          await info.pc.addIceCandidate(payload.candidate);
        } else {
          const pending = pendingIceRef.current.get(payload.peerId) ?? [];
          pending.push(payload.candidate);
          pendingIceRef.current.set(payload.peerId, pending);
        }
      } catch (err) {
        console.error("[meeting] ice failed:", err);
      }
    });

    const cleanup = () => {
      socket?.emit("meeting:leave-room", { meetingId });
      socket?.disconnect();
      for (const info of pcsRef.current.values()) {
        info.pc.close();
      }
      pcsRef.current.clear();
      pendingIceRef.current.clear();
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    };

    window.addEventListener("pagehide", cleanup);

    (async () => {
      try {
        const data = await fetchMeeting(meetingId);
        if (cancelled) return;
        setMeeting(data.meeting);
        nameRef.current = data.me?.name ?? "Guest";
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          if (cancelled) return;
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch {
          if (cancelled) return;
          setHasMedia(false);
          setNotice(
            "Camera or microphone is unavailable. You can still join with audio off.",
          );
        }
        await joinMeeting(meetingId);
        if (!cancelled) {
          const updated = await fetchMeeting(meetingId);
          if (!cancelled) setMeeting(updated.meeting);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load meeting",
        );
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", cleanup);
      cleanup();
    };
  }, [meetingId]);

  useEffect(() => {
    if (!socketConnected) return;
    const startedAt = startedAtRef.current;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [socketConnected]);

  useEffect(() => {
    if (!controls.sharing) return;
    if (screenTrackRef.current && screenPreviewRef.current) {
      screenPreviewRef.current.srcObject = new MediaStream([
        screenTrackRef.current,
      ]);
    }
  }, [controls.sharing]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const toggleMute = () => {
    const next = !controlsRef.current.muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setControls((prev) => ({ ...prev, muted: next }));
    socketRef.current?.emit("meeting:state", {
      meetingId,
      muted: next,
      cameraOn: controlsRef.current.cameraOn,
      sharing: controlsRef.current.sharing,
    });
  };

  const toggleCamera = () => {
    const next = !controlsRef.current.cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setControls((prev) => ({ ...prev, cameraOn: next }));
    socketRef.current?.emit("meeting:state", {
      meetingId,
      muted: controlsRef.current.muted,
      cameraOn: next,
      sharing: controlsRef.current.sharing,
    });
  };

  const replaceVideoSenders = async (
    track: MediaStreamTrack | null,
  ): Promise<void> => {
    for (const info of pcsRef.current.values()) {
      const sender = info.pc
        .getSenders()
        .find((candidate) => candidate.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(track);
      }
    }
  };

  const stopSharing = async () => {
    const screenTrack = screenTrackRef.current;
    screenTrackRef.current = null;
    screenTrack?.stop();
    const cameraTrack = localStreamRef.current
      ?.getVideoTracks()
      .find((track) => track.readyState === "live");
    await replaceVideoSenders(cameraTrack ?? null);
    setControls((prev) => ({ ...prev, sharing: false }));
    socketRef.current?.emit("meeting:state", {
      meetingId,
      muted: controlsRef.current.muted,
      cameraOn: controlsRef.current.cameraOn,
      sharing: false,
    });
  };

  const startSharing = async () => {
    if (controlsRef.current.sharing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const [screenTrack] = stream.getVideoTracks();
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      screenTrack.addEventListener("ended", () => {
        void stopSharing();
      });
      await replaceVideoSenders(screenTrack);
      setControls((prev) => ({ ...prev, sharing: true }));
      socketRef.current?.emit("meeting:state", {
        meetingId,
        muted: controlsRef.current.muted,
        cameraOn: controlsRef.current.cameraOn,
        sharing: true,
      });
    } catch {
      setNotice("Screen sharing was cancelled or is unavailable.");
    }
  };

  const leave = () => {
    socketRef.current?.emit("meeting:leave-room", { meetingId });
    router.push("/calls");
  };

  const endCall = async () => {
    await endMeeting(meetingId);
    leave();
  };

  const copyInviteLink = () => {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => setNotice("Invite link copied"))
      .catch(() => setNotice("Could not copy the invite link"));
  };

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#11131a] text-white">
        <p className="text-[15px] text-[#c3c9d9]">{loadError}</p>
        <button
          type="button"
          className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-medium hover:bg-white/15"
          onClick={() => router.push("/calls")}
        >
          Back to calls
        </button>
      </div>
    );
  }

  const participantCount = peers.length + 1;
  const pinnedPeer = peers.find((peer) => peer.peerId === pinnedPeerId) ?? null;
  const currentPeerStates = {
    muted: controls.muted,
    cameraOn: controls.cameraOn,
    sharing: controls.sharing,
  };

  return (
    <div className="flex h-dvh flex-col bg-[#11131a] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Back to calls"
            className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
            onClick={leave}
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em]">
              {meeting?.title ?? "Meeting"}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] text-[#8b93a7]">
              <Clock3 className="size-3" />
              {formatElapsed(elapsed)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#c3c9d9] sm:flex">
            <span className="size-1.5 rounded-full bg-[#4ade80]" />
            {participantCount} in call
          </span>
          <button
            type="button"
            aria-label="Copy invite link"
            className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
            onClick={copyInviteLink}
          >
            <Copy className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle participants"
            className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => setShowParticipants((value) => !value)}
          >
            <Users className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="workspace-sidebar-scroll flex-1 overflow-y-auto p-4">
            {!socketConnected ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="size-2 animate-pulse rounded-full bg-[#aeb7ff]" />
                <p className="text-[13px] text-[#8b93a7]">
                  Connecting to the meeting room…
                </p>
              </div>
            ) : pinnedPeer ? (
              <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
                <div className="min-h-0 min-w-0 flex-1">
                  <RemoteTile
                    peer={pinnedPeer}
                    stream={remoteStreams[pinnedPeer.peerId]}
                    pinned
                    stage
                    onPinToggle={() => setPinnedPeerId(null)}
                  />
                </div>
                <div className="flex w-full shrink-0 gap-3 overflow-x-auto pb-1 lg:w-72 lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
                  <VideoTile
                    name={nameRef.current}
                    label="You"
                    muted={currentPeerStates.muted}
                    cameraOn={currentPeerStates.cameraOn}
                    sharing={currentPeerStates.sharing}
                    mediaAvailable={hasMedia}
                    videoRef={localVideoRef}
                    sharingVideoRef={screenPreviewRef}
                    isSelf
                    compact
                  />
                  {peers
                    .filter((peer) => peer.peerId !== pinnedPeerId)
                    .map((peer) => (
                      <RemoteTile
                        key={peer.peerId}
                        peer={peer}
                        stream={remoteStreams[peer.peerId]}
                        onPinToggle={() => setPinnedPeerId(peer.peerId)}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <VideoTile
                  name={nameRef.current}
                  label="You"
                  muted={currentPeerStates.muted}
                  cameraOn={currentPeerStates.cameraOn}
                  sharing={currentPeerStates.sharing}
                  mediaAvailable={hasMedia}
                  videoRef={localVideoRef}
                  sharingVideoRef={screenPreviewRef}
                  isSelf
                />
                {peers.map((peer) => (
                  <RemoteTile
                    key={peer.peerId}
                    peer={peer}
                    stream={remoteStreams[peer.peerId]}
                    onPinToggle={() => setPinnedPeerId(peer.peerId)}
                  />
                ))}
              </div>
            )}
          </div>
          <footer className="flex h-20 shrink-0 items-center justify-center gap-3 border-t border-white/10 px-4">
            <ControlButton
              label={controls.muted ? "Unmute" : "Mute"}
              active={!controls.muted}
              danger={controls.muted}
              disabled={!hasMedia}
              onClick={toggleMute}
            >
              {controls.muted ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </ControlButton>
            <ControlButton
              label={controls.cameraOn ? "Turn camera off" : "Turn camera on"}
              active={controls.cameraOn}
              danger={!controls.cameraOn}
              disabled={!hasMedia}
              onClick={toggleCamera}
            >
              {controls.cameraOn ? (
                <Video className="size-4" />
              ) : (
                <VideoOff className="size-4" />
              )}
            </ControlButton>
            <ControlButton
              label={controls.sharing ? "Stop presenting" : "Share screen"}
              active={controls.sharing}
              onClick={() => {
                if (controls.sharing) {
                  void stopSharing();
                } else {
                  void startSharing();
                }
              }}
            >
              {controls.sharing ? (
                <Presentation className="size-4" />
              ) : (
                <MonitorUp className="size-4" />
              )}
            </ControlButton>
            <button
              type="button"
              aria-label="Leave call"
              className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={leave}
            >
              <PhoneOff className="size-4" />
            </button>
            {meeting?.isHost ? (
              <button
                type="button"
                aria-label="End call for everyone"
                className="flex size-11 items-center justify-center rounded-full bg-[#e5484d] text-white transition-colors hover:bg-[#dc3d43]"
                onClick={() => void endCall()}
              >
                <MoreHorizontal className="size-4" />
              </button>
            ) : null}
          </footer>
        </main>
        {showParticipants ? (
          <>
            <button
              type="button"
              aria-label="Close participants"
              className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
              onClick={() => setShowParticipants(false)}
            />
            <ParticipantsPanel
              meeting={meeting}
              peers={peers}
              selfName={nameRef.current}
              selfState={currentPeerStates}
              onClose={() => setShowParticipants(false)}
            />
          </>
        ) : null}
      </div>

      {notice ? (
        <div
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-medium text-[#2e3138] shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function VideoTile({
  name,
  label,
  muted,
  cameraOn,
  sharing,
  mediaAvailable = true,
  videoRef,
  sharingVideoRef,
  isSelf = false,
  compact = false,
}: {
  name: string;
  label: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
  mediaAvailable?: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sharingVideoRef?: React.RefObject<HTMLVideoElement | null>;
  isSelf?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#1c2029]",
        compact && "w-64 shrink-0 lg:w-auto lg:shrink",
      )}
    >
      {sharing ? (
        <video
          ref={sharingVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : !cameraOn || !mediaAvailable ? (
        <InitialsBackdrop
          name={name}
          caption={mediaAvailable ? "Camera off" : "No camera"}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            isSelf && "scale-x-[-1]",
          )}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
        <span className="flex items-center gap-2 rounded-lg bg-[#0b0d12]/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
          {sharing ? (
            <span className="flex items-center gap-1.5 text-[#aeb7ff]">
              <Presentation className="size-3" /> Presenting
            </span>
          ) : (
            <>
              {name}
              {isSelf ? (
                <span className="text-[#8b93a7]">({label})</span>
              ) : null}
            </>
          )}
        </span>
        {muted ? (
          <span className="flex size-6 items-center justify-center rounded-full bg-[#0b0d12]/70 backdrop-blur-sm">
            <MicOff className="size-3 text-[#e5484d]" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RemoteTile({
  peer,
  stream,
  pinned = false,
  stage = false,
  onPinToggle,
}: {
  peer: MeetingPeer;
  stream?: MediaStream;
  pinned?: boolean;
  stage?: boolean;
  onPinToggle?: () => void;
}) {
  const showVideo = Boolean(stream) && (peer.cameraOn || peer.sharing);
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1c2029]",
        stage ? "h-full w-full" : "aspect-video",
      )}
    >
      {showVideo ? (
        // biome-ignore lint/a11y/useMediaCaption: live WebRTC stream has no caption track
        <video
          autoPlay
          playsInline
          ref={(element) => {
            if (element && stream && element.srcObject !== stream) {
              element.srcObject = stream;
            }
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <InitialsBackdrop name={peer.name} />
      )}
      {pinned ? (
        <span className="absolute left-3 top-3 rounded-lg bg-[#0b0d12]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#aeb7ff] backdrop-blur-sm">
          Pinned
        </span>
      ) : null}
      {onPinToggle ? (
        <button
          type="button"
          aria-label={pinned ? `Unpin ${peer.name}` : `Pin ${peer.name}`}
          className={cn(
            "absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg bg-[#0b0d12]/70 text-[#c3c9d9] backdrop-blur-sm transition-colors hover:bg-[#0b0d12] hover:text-white",
            pinned
              ? "text-[#aeb7ff]"
              : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
          )}
          onClick={onPinToggle}
        >
          {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </button>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
        <span className="flex items-center gap-2 rounded-lg bg-[#0b0d12]/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
          {peer.sharing ? (
            <span className="flex items-center gap-1.5 text-[#aeb7ff]">
              <Presentation className="size-3" /> Presenting
            </span>
          ) : (
            peer.name
          )}
        </span>
        {peer.muted ? (
          <span className="flex size-6 items-center justify-center rounded-full bg-[#0b0d12]/70 backdrop-blur-sm">
            <MicOff className="size-3 text-[#e5484d]" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function InitialsBackdrop({
  name,
  caption = "Camera off",
}: {
  name: string;
  caption?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#2c3a5e] text-[18px] font-semibold text-[#b9c0ed]">
        {getInitials(name)}
      </span>
      <span className="text-[12px] font-medium text-[#8b93a7]">{caption}</span>
    </div>
  );
}

function ParticipantsPanel({
  meeting,
  peers,
  selfName,
  selfState,
  onClose,
}: {
  meeting: MeetingSummary | null;
  peers: MeetingPeer[];
  selfName: string;
  selfState: { muted: boolean; cameraOn: boolean; sharing: boolean };
  onClose: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-[320px] flex-col overflow-y-auto border-l border-white/10 bg-[#11131a] p-4 lg:static lg:z-auto lg:w-[260px] lg:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#e8eaf0]">
          Participants
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8b93a7]">{peers.length + 1}</span>
          <button
            type="button"
            aria-label="Close participants"
            className="rounded-lg p-1 text-[#8b93a7] transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-[#6d7488]">
        {meeting?.description ?? "Join the conversation."}
      </p>
      <ul className="mt-4 space-y-1">
        <ParticipantRow
          name={selfName}
          sub="You"
          muted={selfState.muted}
          cameraOn={selfState.cameraOn}
          sharing={selfState.sharing}
          host={meeting?.isHost ?? false}
        />
        {peers.map((peer) => (
          <ParticipantRow
            key={peer.peerId}
            name={peer.name}
            sub={peer.userId === null ? "Guest" : undefined}
            muted={peer.muted}
            cameraOn={peer.cameraOn}
            sharing={peer.sharing}
          />
        ))}
      </ul>
    </aside>
  );
}

function ParticipantRow({
  name,
  sub,
  muted,
  cameraOn,
  sharing,
  host = false,
}: {
  name: string;
  sub?: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
  host?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#242d47] text-[10px] font-semibold text-[#b9c0ed]">
        {getInitials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#e8eaf0]">
          <span className="truncate">{name}</span>
          {host ? (
            <span className="rounded bg-[#aeb7ff]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#aeb7ff]">
              Host
            </span>
          ) : null}
        </span>
        {sub ? (
          <span className="block text-[10px] text-[#8b93a7]">{sub}</span>
        ) : null}
      </span>
      <span className="flex items-center gap-1.5 text-[#6d7488]">
        {sharing ? <Share2 className="size-3.5 text-[#aeb7ff]" /> : null}
        {muted ? <MicOff className="size-3.5" /> : null}
        {!cameraOn ? <VideoOff className="size-3.5" /> : null}
      </span>
    </li>
  );
}

function ControlButton({
  label,
  active,
  danger = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-40",
        danger
          ? "bg-[#e5484d] text-white hover:bg-[#dc3d43]"
          : active
            ? "bg-white text-[#2e3138] hover:bg-white/85"
            : "bg-white/10 text-white hover:bg-white/20",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { MeetingRoom };
