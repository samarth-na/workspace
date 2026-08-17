"use client";

import { ArrowLeft, Clock, Close, Users } from "pixelarticons/react";
import { useCallback } from "react";
import {
  CallControlsBar,
  CallTiles,
  formatElapsed,
} from "@/components/calls/call-room-ui";
import { useCallSession } from "@/components/calls/use-call-session";
import { cn } from "@/lib/utils";

function CallPanel({
  callId,
  onClose,
  onNotify,
}: {
  callId: string;
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  const {
    call,
    loadError,
    selfName,
    peers,
    remoteStreams,
    controls,
    socketConnected,
    hasMedia,
    elapsed,
    notice,
    localVideoRef,
    screenPreviewRef,
    isHost,
    ringing,
    toggleMute,
    toggleCamera,
    startSharing,
    stopSharing,
    endCall,
    leaveCall,
  } = useCallSession({
    callId,
    onEnded: useCallback(
      (reason) => {
        onClose();
        onNotify(
          reason === "ended"
            ? "Call ended"
            : reason === "left"
              ? "You left the call"
              : "The call ended",
        );
      },
      [onClose, onNotify],
    ),
  });

  const names = call
    ? call.members
        .filter((member) => member.name !== selfName)
        .map((member) => member.name)
        .join(", ")
    : "";
  const title = call ? `Call with ${names || "your team"}` : "Call";

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c212e]/40 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Call error"
          className="w-full max-w-sm rounded-2xl border border-[#e3e5ea] bg-white p-6 text-center shadow-[0_20px_50px_rgba(35,43,66,0.18)]"
        >
          <p className="text-[13px] text-[#4b5568]">{loadError}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-[#5b64d6] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4e57c5]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const closeCall = () => {
    if (isHost) {
      endCall();
    } else {
      leaveCall();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c212e]/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[min(680px,calc(100dvh-32px))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11131a] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Back to chat"
              className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
              onClick={closeCall}
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                {title}
              </h1>
              <p className="flex items-center gap-1.5 text-[11px] text-[#8b93a7]">
                <Clock className="size-3" />
                {socketConnected
                  ? ringing && peers.length === 0
                    ? "Ringing…"
                    : formatElapsed(elapsed)
                  : "Connecting…"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#c3c9d9] sm:flex">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  ringing ? "animate-pulse bg-[#9cb8f7]" : "bg-[#4ade80]",
                )}
              />
              {ringing && peers.length === 0
                ? `${call?.members.length ?? 1} invited`
                : `${peers.length + 1} in call`}
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#c3c9d9]"
              title={call?.members.map((member) => member.name).join(", ")}
            >
              <Users className="size-3" />
              {call?.members.length ?? 1}
            </span>
            <button
              type="button"
              aria-label="Close call"
              className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
              onClick={closeCall}
            >
              <Close className="size-4" />
            </button>
          </div>
        </header>

        <div className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {!socketConnected ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center">
              <span className="size-2 animate-pulse rounded-full bg-[#9cb8f7]" />
              <p className="text-[13px] text-[#8b93a7]">
                Connecting to the call…
              </p>
            </div>
          ) : (
            <CallTiles
              selfName={selfName}
              selfState={controls}
              mediaAvailable={hasMedia}
              localVideoRef={localVideoRef}
              screenPreviewRef={screenPreviewRef}
              peers={peers}
              remoteStreams={remoteStreams}
              compact
            />
          )}
        </div>

        <footer className="flex h-20 shrink-0 items-center justify-center gap-3 border-t border-white/10 px-4">
          <CallControlsBar
            muted={controls.muted}
            cameraOn={controls.cameraOn}
            sharing={controls.sharing}
            mediaAvailable={hasMedia}
            isHost={isHost}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleShare={() => {
              if (controls.sharing) {
                void stopSharing();
              } else {
                void startSharing();
              }
            }}
            onEnd={endCall}
            onLeave={leaveCall}
          />
        </footer>
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

export { CallPanel };
