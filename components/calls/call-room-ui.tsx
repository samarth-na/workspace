"use client";

import {
  EyeOff,
  Logout,
  Mic,
  MicOff,
  Monitor,
  Presentation,
  Video,
} from "pixelarticons/react";
import type { RefObject } from "react";
import type { CallPeer } from "@/lib/call-types";
import { cn } from "@/lib/utils";

export function CallTiles({
  selfName,
  selfState,
  mediaAvailable,
  localVideoRef,
  screenPreviewRef,
  peers,
  remoteStreams,
  compact = false,
}: {
  selfName: string;
  selfState: { muted: boolean; cameraOn: boolean; sharing: boolean };
  mediaAvailable: boolean;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  screenPreviewRef: RefObject<HTMLVideoElement | null>;
  peers: CallPeer[];
  remoteStreams: Record<string, MediaStream>;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2",
        compact && "xl:grid-cols-2",
        !compact && "xl:grid-cols-3",
      )}
    >
      <CallVideoTile
        name={selfName}
        label="You"
        muted={selfState.muted}
        cameraOn={selfState.cameraOn}
        sharing={selfState.sharing}
        mediaAvailable={mediaAvailable}
        videoRef={localVideoRef}
        sharingVideoRef={screenPreviewRef}
        isSelf
      />
      {peers.map((peer) => (
        <CallRemoteTile
          key={peer.peerId}
          peer={peer}
          stream={remoteStreams[peer.peerId]}
        />
      ))}
    </div>
  );
}

export function CallControlsBar({
  muted,
  cameraOn,
  sharing,
  mediaAvailable,
  isHost,
  onToggleMute,
  onToggleCamera,
  onToggleShare,
  onEnd,
  onLeave,
}: {
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
  mediaAvailable: boolean;
  isHost: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onEnd: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <CallControlButton
        label={muted ? "Unmute" : "Mute"}
        active={!muted}
        danger={muted}
        disabled={!mediaAvailable}
        onClick={onToggleMute}
      >
        {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </CallControlButton>
      <CallControlButton
        label={cameraOn ? "Turn camera off" : "Turn camera on"}
        active={cameraOn}
        danger={!cameraOn}
        disabled={!mediaAvailable}
        onClick={onToggleCamera}
      >
        {cameraOn ? (
          <Video className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
      </CallControlButton>
      <CallControlButton
        label={sharing ? "Stop presenting" : "Share screen"}
        active={sharing}
        onClick={onToggleShare}
      >
        {sharing ? (
          <Presentation className="size-4" />
        ) : (
          <Monitor className="size-4" />
        )}
      </CallControlButton>
      {isHost ? (
        <button
          type="button"
          aria-label="End call"
          className="flex size-11 items-center justify-center rounded-full bg-[#e5484d] text-white transition-colors hover:bg-[#dc3d43]"
          onClick={onEnd}
        >
          <Logout className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Leave call"
          className="flex size-11 items-center justify-center rounded-full bg-[#e5484d] text-white transition-colors hover:bg-[#dc3d43]"
          onClick={onLeave}
        >
          <Logout className="size-4" />
        </button>
      )}
    </div>
  );
}

function CallControlButton({
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

function CallVideoTile({
  name,
  label,
  muted,
  cameraOn,
  sharing,
  mediaAvailable,
  videoRef,
  sharingVideoRef,
  isSelf,
}: {
  name: string;
  label: string;
  muted: boolean;
  cameraOn: boolean;
  sharing: boolean;
  mediaAvailable: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  sharingVideoRef?: RefObject<HTMLVideoElement | null>;
  isSelf?: boolean;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#1c2029]">
      {sharing ? (
        <video
          ref={sharingVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : !cameraOn || !mediaAvailable ? (
        <CallInitialsBackdrop
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
            <span className="flex items-center gap-1.5 text-[#9cb8f7]">
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

function CallRemoteTile({
  peer,
  stream,
}: {
  peer: CallPeer;
  stream?: MediaStream;
}) {
  const showVideo = Boolean(stream) && (peer.cameraOn || peer.sharing);
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#1c2029]">
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
        <CallInitialsBackdrop name={peer.name} />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
        <span className="flex items-center gap-2 rounded-lg bg-[#0b0d12]/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
          {peer.sharing ? (
            <span className="flex items-center gap-1.5 text-[#9cb8f7]">
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

function CallInitialsBackdrop({
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

export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
