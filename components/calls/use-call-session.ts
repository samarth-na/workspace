"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  endCall as endCallApi,
  fetchCall,
  heartbeatCall,
  joinCall,
} from "@/components/calls/call-api";
import {
  type CallSocket,
  createCallSocket,
} from "@/components/calls/call-socket";
import type {
  CallIceCandidate,
  CallPeer,
  CallSignalDescription,
  CallSummary,
} from "@/lib/call-types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const HEARTBEAT_INTERVAL_MS = 15_000;

type PeerConnectionInfo = {
  pc: RTCPeerConnection;
  initiated: boolean;
};

type Controls = {
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
};

export type CallEndReason = "ended" | "left" | "ended-remote";

export function useCallSession({
  callId,
  onEnded,
}: {
  callId: string;
  onEnded: (reason: CallEndReason) => void;
}) {
  const [call, setCall] = useState<CallSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selfName, setSelfName] = useState("Guest");
  const [peers, setPeers] = useState<CallPeer[]>([]);
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
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMedia, setHasMedia] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenPreviewRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pcsRef = useRef(new Map<string, PeerConnectionInfo>());
  const pendingIceRef = useRef(new Map<string, CallIceCandidate[]>());
  const socketRef = useRef<CallSocket | null>(null);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const startedAtRef = useRef<number>(Date.now());
  const nameRef = useRef("Guest");
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const endedRef = useRef(false);

  const emitState = useCallback(
    (next: Controls) => {
      socketRef.current?.emit("meeting:state", {
        meetingId: callId,
        muted: next.muted,
        cameraOn: next.cameraOn,
        sharing: next.sharing,
      });
    },
    [callId],
  );

  const cleanupMedia = useCallback(() => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    localStreamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket: CallSocket | null = null;
    let heartbeatTimer: number | null = null;
    endedRef.current = false;

    const emitOffer = (peerId: string, description: CallSignalDescription) => {
      socket?.emit("meeting:offer", { meetingId: callId, peerId, description });
    };
    const emitAnswer = (peerId: string, description: CallSignalDescription) => {
      socket?.emit("meeting:answer", {
        meetingId: callId,
        peerId,
        description,
      });
    };
    const emitIce = (peerId: string, candidate: CallIceCandidate) => {
      socket?.emit("meeting:ice", { meetingId: callId, peerId, candidate });
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
        console.error("[call] renegotiate failed:", err);
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

    const finishSession = () => {
      if (cancelled) return;
      socket?.emit("meeting:leave-room", { meetingId: callId });
      socket?.disconnect();
      for (const info of pcsRef.current.values()) {
        info.pc.close();
      }
      pcsRef.current.clear();
      pendingIceRef.current.clear();
      cleanupMedia();
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    socket = createCallSocket(callId);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (cancelled) return;
      setSocketConnected(true);
      const { muted, cameraOn } = controlsRef.current;
      socket?.emit("meeting:join-room", {
        meetingId: callId,
        name: nameRef.current,
        muted,
        cameraOn,
      });
      void joinCall(callId)
        .then((data) => {
          if (!cancelled) setCall(data.call);
        })
        .catch(() => {});
      if (heartbeatTimer === null) {
        void heartbeatCall(callId).catch(() => {});
        heartbeatTimer = window.setInterval(() => {
          void heartbeatCall(callId).catch(() => {});
        }, HEARTBEAT_INTERVAL_MS);
      }
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
        console.error("[call] answer failed:", err);
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
        console.error("[call] accept answer failed:", err);
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
        console.error("[call] ice failed:", err);
      }
    });

    socket.on("call:hangup", (payload) => {
      if (cancelled || payload.callId !== callId) return;
      onEndedRef.current("ended-remote");
      finishSession();
    });

    const cleanup = () => {
      finishSession();
    };

    window.addEventListener("pagehide", cleanup);

    (async () => {
      try {
        const data = await fetchCall(callId);
        if (cancelled) return;
        if (data.call.status === "ended") {
          onEndedRef.current("ended-remote");
          return;
        }
        setCall(data.call);
        nameRef.current = data.me?.name ?? "Guest";
        setSelfName(data.me?.name ?? "Guest");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          if (cancelled) {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            return;
          }
          localStreamRef.current = stream;
          setMediaReady(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch {
          if (cancelled) return;
          setHasMedia(false);
          setMediaReady(false);
          setNotice(
            "Camera or microphone is unavailable. You can still join with audio off.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load call",
        );
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", cleanup);
      cleanup();
    };
  }, [callId, cleanupMedia]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reattach the stream when the conditional video tile mounts.
  useEffect(() => {
    const video = localVideoRef.current;
    const stream = localStreamRef.current;
    if (!video || !stream || video.srcObject === stream) return;
    video.srcObject = stream;
  }, [controls.cameraOn, controls.sharing, mediaReady, socketConnected]);

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
    const updated = { ...controlsRef.current, muted: next };
    setControls(updated);
    emitState(updated);
  };

  const toggleCamera = () => {
    const next = !controlsRef.current.cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    const updated = { ...controlsRef.current, cameraOn: next };
    setControls(updated);
    emitState(updated);
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
    const updated = { ...controlsRef.current, sharing: false };
    setControls(updated);
    emitState(updated);
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
      const updated = { ...controlsRef.current, sharing: true };
      setControls(updated);
      emitState(updated);
    } catch {
      setNotice("Screen sharing was cancelled or is unavailable.");
    }
  };

  const endCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    void endCallApi(callId).catch(() => {});
    socketRef.current?.emit("call:hangup", { callId });
    socketRef.current?.emit("meeting:leave-room", { meetingId: callId });
    socketRef.current?.disconnect();
    for (const info of pcsRef.current.values()) {
      info.pc.close();
    }
    pcsRef.current.clear();
    pendingIceRef.current.clear();
    cleanupMedia();
    onEndedRef.current("ended");
  }, [callId, cleanupMedia]);

  const leaveCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    socketRef.current?.emit("meeting:leave-room", { meetingId: callId });
    socketRef.current?.disconnect();
    for (const info of pcsRef.current.values()) {
      info.pc.close();
    }
    pcsRef.current.clear();
    pendingIceRef.current.clear();
    cleanupMedia();
    onEndedRef.current("left");
  }, [callId, cleanupMedia]);

  return {
    call,
    loadError,
    selfName,
    peers,
    remoteStreams,
    controls,
    socketConnected,
    mediaReady,
    hasMedia,
    elapsed,
    notice,
    setNotice,
    localVideoRef,
    screenPreviewRef,
    isHost: call?.isHost ?? false,
    ringing: (call?.status ?? "ringing") === "ringing",
    toggleMute,
    toggleCamera,
    startSharing,
    stopSharing,
    endCall,
    leaveCall,
  };
}
