"use client";

import { Search, Terminal } from "pixelarticons/react";
import { Avatar } from "@/components/shared/avatar";
import { useShell } from "./shell-context";

function breadcrumbLabel(pathname: string) {
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return "";
  if (pathname === "/files" || pathname.startsWith("/files/")) return "Files";
  if (pathname === "/tasks" || pathname.startsWith("/tasks/")) return "Tasks";
  if (pathname === "/calls" || pathname.startsWith("/calls/")) return "Calls";
  if (pathname === "/people" || pathname.startsWith("/people/"))
    return "People";
  return "Home";
}

export function Header({
  pathname,
  onOpenMobileSidebar,
}: {
  pathname: string;
  onOpenMobileSidebar: () => void;
}) {
  const { userName, userImage, openSearch, toggleProfile } = useShell();
  const label = breadcrumbLabel(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[var(--bg-border-color)]/90 bg-[var(--header-color)]/90 px-5 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg bg-[#232b42] text-[12px] font-semibold text-white lg:hidden"
          aria-label="Open workspace menu"
          onClick={onOpenMobileSidebar}
        >
          C
        </button>
        <div className="flex items-center gap-2 text-[13px] text-[#8c94a4]">
          <span className="hidden sm:inline">Workspace</span>
          {label ? (
            <>
              <span className="hidden text-[#c4c8d0] sm:inline">/</span>
              <span className="font-medium text-[#3f4859]">{label}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden h-8 items-center gap-2 rounded-lg border border-[#e3e5ea] bg-white px-2.5 text-[12px] text-[#8991a0] shadow-[0_1px_2px_rgba(18,24,40,0.02)] transition hover:border-[#d6dae2] hover:text-[#5d6677] sm:flex"
          onClick={openSearch}
        >
          <Search className="size-3.5" />
          <span>Search</span>
          <span className="ml-3 flex items-center gap-0.5 rounded border border-[#e6e8ec] px-1 text-[10px] text-[#9aa1ad]">
            <Terminal className="size-2.5" /> K
          </span>
        </button>
        <button
          type="button"
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-lg text-[#7f8797] hover:bg-white sm:hidden"
          onClick={openSearch}
        >
          <Search className="size-[17px]" />
        </button>

        <button
          type="button"
          aria-label="Open profile menu"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full"
          onClick={toggleProfile}
        >
          <Avatar
            src={userImage}
            name={userName}
            className="size-8 rounded-full bg-[#d9d6f4] text-[10px] text-[#514e9a]"
          />
        </button>
      </div>
    </header>
  );
}
