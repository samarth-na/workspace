"use client";

import { CircleHelp, Settings2 } from "lucide-react";
import { getInitials } from "./shell-context";

export function ProfileMenu({
  userName,
  isSignedIn,
  onClose,
}: {
  userName: string;
  isSignedIn: boolean;
  onClose: () => void;
}) {
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
          <span className="flex size-9 items-center justify-center rounded-full bg-[#d9d6f4] text-[11px] font-semibold text-[#514e9a]">
            {getInitials(userName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[#414a5d]">
              {userName}
            </p>
            <p className="text-[11px] text-[#9299a8]">
              {isSignedIn ? "Personal account" : "Preview workspace"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
        >
          <Settings2 className="size-4 text-[#9299a8]" />
          Account settings
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
        >
          <CircleHelp className="size-4 text-[#9299a8]" />
          Keyboard shortcuts
        </button>
      </div>
    </div>
  );
}
