"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Copy, Users } from "pixelarticons/react";
import { useCallback } from "react";
import {
  CallControlsBar,
  CallTiles,
  formatElapsed,
} from "@/components/calls/call-room-ui";
import { useCallSession } from "@/components/calls/use-call-session";

function CallRoom({ callId }: { callId: string }) {
  const router = useRouter();
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
    setNotice,
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
    onEnded: useCallback(() => router.replace("/calls"), [router]),
  });

  const copyInviteLink = () => {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => setNotice("Invite link copied"))
      .catch(() => setNotice("Could not copy the invite link"));
  };

  const names = call
    ? call.members
        .filter((member) => member.name !== selfName)
        .map((member) => member.name)
        .join(", ")
    : "";
  const title = call ? `Call with ${names || "your team"}` : "Call";

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#11131a] text-white">
        <p className="text-[15px] text-[#c3c9d9]">{loadError}</p>
        <button
          type="button"
          className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-medium hover:bg-white/15"
          onClick={() => router.replace("/calls")}
        >
          Back to calls
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[#11131a] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Leave call"
            className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
            onClick={isHost ? endCall : leaveCall}
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
                ? ringing
                  ? "Ringing…"
                  : formatElapsed(elapsed)
                : "Connecting…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#c3c9d9] sm:flex">
            <span className="size-1.5 rounded-full bg-[#4ade80]" />
            {peers.length + 1} in call
          </span>
          <button
            type="button"
            aria-label="Copy invite link"
            className="rounded-lg p-2 text-[#9aa2b5] transition-colors hover:bg-white/10 hover:text-white"
            onClick={copyInviteLink}
          >
            <Copy className="size-4" />
          </button>
          <span
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#c3c9d9]"
            title={call?.members.map((member) => member.name).join(", ")}
          >
            <Users className="size-3" />
            {call?.members.length ?? 1}
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="workspace-sidebar-scroll flex-1 overflow-y-auto p-4">
          {!socketConnected ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
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
      </main>

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

export { CallRoom };
