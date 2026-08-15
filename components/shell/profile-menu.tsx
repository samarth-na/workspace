"use client";

import { Camera, CircleHelp, Loader2, LogOut, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Avatar } from "@/components/shared/avatar";
import { authClient } from "@/lib/auth-client";
import { compressImage } from "@/lib/image-compress";

export function ProfileMenu({
  userName,
  userImage,
  isSignedIn,
  workspaceName,
  isWorkspaceAdmin,
  onClose,
}: {
  userName: string;
  userImage: string | null;
  isSignedIn: boolean;
  workspaceName: string;
  isWorkspaceAdmin: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const changePicture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not upload picture");
        return;
      }
      const result = await authClient.updateUser({ image: data.url });
      if (result.error) {
        setError(result.error.message ?? "Could not update picture");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Could not upload picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20">
      <button
        type="button"
        aria-label="Close profile menu"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="absolute right-4 top-[58px] w-60 rounded-xl border border-[#e3e5ea] bg-white p-2 shadow-[0_12px_30px_rgba(35,43,66,0.13)] sm:right-8">
        <div className="flex items-center gap-3 rounded-lg bg-[#f7f8fa] p-3">
          <span className="relative shrink-0">
            <Avatar
              src={userImage}
              name={userName}
              className="size-9 rounded-full bg-[#d9d6f4] text-[11px] text-[#514e9a]"
            />
            {isSignedIn ? (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-white bg-[#eef0f4] text-[#7d8494]">
                <Camera className="size-2.5" />
              </span>
            ) : null}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[#414a5d]">
              {userName}
            </p>
            <p className="truncate text-[11px] text-[#9299a8]">
              {isSignedIn
                ? isWorkspaceAdmin
                  ? `${workspaceName} · Admin`
                  : `${workspaceName} · Member`
                : "Preview workspace"}
            </p>
          </div>
        </div>
        {isSignedIn ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void changePicture(event)}
            />
            <button
              type="button"
              disabled={uploading}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8] disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin text-[#9299a8]" />
              ) : (
                <Camera className="size-4 text-[#9299a8]" />
              )}
              {uploading ? "Uploading…" : "Change picture"}
            </button>
          </>
        ) : null}
        {error ? (
          <p className="px-2.5 pb-1 pt-1 text-[11px] text-[#b42318]">{error}</p>
        ) : null}
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
          onClick={() => {
            onClose();
            router.push("/settings");
          }}
        >
          <Settings2 className="size-4 text-[#9299a8]" />
          Workspace settings
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
        >
          <CircleHelp className="size-4 text-[#9299a8]" />
          Keyboard shortcuts
        </button>
        {isSignedIn ? (
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-[#eef0f4] px-2.5 py-2.5 text-[12px] text-[#b42318] hover:bg-[#fdf0f0] disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
