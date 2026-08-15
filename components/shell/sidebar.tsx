"use client";

import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  Folder,
  Home,
  Image,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Plus,
  Settings2,
  Table2,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials, useShell } from "./shell-context";

const NAV_ITEMS: { href: string; icon: typeof FileText; label: string }[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/inbox", icon: Bell, label: "Inbox" },
  { href: "/tasks", icon: ListTodo, label: "Tasks" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/files", icon: Folder, label: "Files" },
  { href: "/calls", icon: Video, label: "Calls" },
  { href: "/people", icon: Users, label: "People" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isInboxPath(pathname: string) {
  return pathname === "/inbox" || pathname.startsWith("/inbox/");
}

function isMessagesPath(pathname: string) {
  return pathname === "/messages" || pathname.startsWith("/messages/");
}

export function DesktopSidebar({
  pathname,
  unread,
}: {
  pathname: string;
  unread: { inbox: boolean; messages: boolean };
}) {
  const { userName, isSignedIn, notify, navigate, openCreate, toggleProfile } =
    useShell();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[var(--bg-border-color)] bg-[var(--bg-sidebar-color)] px-3 py-4 lg:flex">
      <div className="mb-7 flex items-center justify-between px-2">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-[#f0f1f4]"
          onClick={toggleProfile}
        >
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-[#9cb8f7] text-[12px] font-semibold text-[#31518e]">
            {getInitials(userName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
              {userName}
            </span>
            <span className="block text-[11px] text-[#8991a3]">
              Cedar & Co.
            </span>
          </span>
          <ChevronDown className="ml-1 size-3.5 text-[#9299a8]" />
        </button>
        <button
          type="button"
          aria-label="Workspace settings"
          className="rounded-md p-1.5 text-[#9299a8] transition-colors hover:bg-[#f0f1f4] hover:text-[#4d5669]"
          onClick={() => notify("Workspace settings opened")}
        >
          <Settings2 className="size-[15px]" />
        </button>
      </div>

      <nav aria-label="Primary" className="mb-5 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href, pathname)}
            dot={
              (item.href === "/inbox" &&
                unread.inbox &&
                !isInboxPath(pathname)) ||
              (item.href === "/messages" &&
                unread.messages &&
                !isMessagesPath(pathname))
            }
          />
        ))}
      </nav>

      <div className="rounded-xl bg-[#e9e9ea] px-2.5 py-2">
        <div className="flex items-center justify-between text-[13px] font-medium text-[#4f4f52]">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="size-3.5 text-[#949497]" /> Meetings
          </span>
          <MoreHorizontal className="size-4 text-[#929295]" />
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/60"
          onClick={() => {
            navigate("/calls");
            notify("Opening Weekly product sync");
          }}
        >
          <span className="size-3 rounded-[3px] bg-[#67bd8b]" />
          <span className="flex-1 truncate text-[13px] text-[#606064]">
            Weekly product sync
          </span>
          <span className="text-[11px] text-[#969699]">10:30 AM</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-1.5 py-2 text-left text-[#99999b] hover:text-[#5b5b5e]"
          onClick={openCreate}
        >
          <Plus className="size-4" />{" "}
          <span className="text-[13px]">New meeting note</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-1.5 py-1 text-left text-[#99999b] hover:text-[#5b5b5e]"
          onClick={() => navigate("/calls")}
        >
          <ArrowUpRight className="size-4" />{" "}
          <span className="text-[13px]">View all</span>
        </button>
      </div>

      <div className="workspace-sidebar-scroll mt-6 flex-1 overflow-y-auto pr-1">
        <SidebarGroup label="Recents">
          <SidebarLink
            icon={LayoutDashboard}
            label="Dashboard"
            href="/"
            active={isActive("/", pathname)}
          />
          <SidebarLink
            icon={FileText}
            label="Q3 product brief"
            href="/files"
            onClick={() => notify("Opening Q3 product brief")}
          />
          <SidebarLink
            icon={Image}
            label="Launch moodboard"
            href="/files"
            onClick={() => notify("Opening Launch moodboard")}
          />
          <SidebarLink
            icon={Table2}
            label="Sprint planning"
            href="/files"
            onClick={() => notify("Opening Sprint planning")}
          />
          <SidebarLink
            icon={Folder}
            label="Shared files"
            href="/files"
            active={isActive("/files", pathname)}
          />
          <SidebarLink
            icon={MessageCircle}
            label="# product"
            href="/messages/conv-channel-product"
            active={isActive("/messages", pathname)}
          />
        </SidebarGroup>
      </div>

      <div className="mt-auto border-t border-[#e9ebef] pt-3">
        <SidebarLink
          icon={CircleHelp}
          label="Help center"
          onClick={() => notify("Help center opened")}
        />
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f0f1f4]"
          onClick={toggleProfile}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-[#d9d6f4] text-[10px] font-semibold text-[#514e9a]">
            {getInitials(userName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-[#3d4658]">
              {userName}
            </span>
            <span className="block truncate text-[11px] text-[#9299a8]">
              {isSignedIn ? "Personal account" : "Preview workspace"}
            </span>
          </span>
          <MoreHorizontal className="size-4 text-[#a1a8b5]" />
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar({
  pathname,
  unread,
  onClose,
  onCreate,
  onProfile,
  onView,
}: {
  pathname: string;
  unread: { inbox: boolean; messages: boolean };
  onClose: () => void;
  onCreate: () => void;
  onProfile: () => void;
  onView: (href: string) => void;
}) {
  const { userName } = useShell();
  return (
    <aside className="relative z-10 flex h-full w-[min(88vw,360px)] flex-col bg-[#f8f8f9] px-3 py-4 shadow-[12px_0_30px_rgba(32,32,36,0.1)]">
      <div className="mb-6 flex items-center justify-between px-2">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-[#eeeeef]"
          onClick={onProfile}
        >
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-[#9cb8f7] text-[12px] font-semibold text-[#31518e]">
            {getInitials(userName)}
          </span>
          <span>
            <span className="block text-[15px] font-medium text-[#353538]">
              {userName}&apos;s workspace
            </span>
            <span className="block text-[11px] text-[#9a9a9d]">
              Cedar & Co.
            </span>
          </span>
          <ChevronDown className="size-4 text-[#949497]" />
        </button>
        <button
          type="button"
          aria-label="Close workspace menu"
          className="rounded-lg p-2 text-[#969699] hover:bg-[#eeeeef]"
          onClick={onClose}
        >
          <ChevronDown className="size-4 rotate-90" />
        </button>
      </div>
      <nav aria-label="Primary" className="mb-5 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href, pathname)}
            dot={
              (item.href === "/inbox" &&
                unread.inbox &&
                !isInboxPath(pathname)) ||
              (item.href === "/messages" &&
                unread.messages &&
                !isMessagesPath(pathname))
            }
            onClick={onClose}
          />
        ))}
      </nav>
      <div className="rounded-xl bg-[#ececed] px-2.5 py-2">
        <div className="flex items-center justify-between text-[14px] text-[#4d4d50]">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="size-3.5 text-[#949497]" /> Meetings
          </span>
          <MoreHorizontal className="size-4 text-[#929295]" />
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left hover:bg-white/60"
          onClick={() => onView("/calls")}
        >
          <span className="size-3 rounded-[3px] bg-[#67bd8b]" />
          <span className="flex-1 text-[14px] text-[#5d5d60]">
            Weekly product sync
          </span>
          <span className="text-[12px] text-[#99999b]">10:30 AM</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-1.5 py-2 text-left text-[#a0a0a3] hover:text-[#626265]"
          onClick={onCreate}
        >
          <Plus className="size-4" />
          <span className="text-[14px]">New meeting note</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-1.5 py-1 text-left text-[#a0a0a3] hover:text-[#626265]"
          onClick={() => onView("/calls")}
        >
          <ArrowUpRight className="size-4" />
          <span className="text-[14px]">View all</span>
        </button>
      </div>
      <div className="workspace-sidebar-scroll mt-7 flex-1 overflow-y-auto px-1">
        <SidebarGroup label="Recents">
          <SidebarLink
            icon={LayoutDashboard}
            label="Dashboard"
            href="/"
            active={isActive("/", pathname)}
            onClick={onClose}
          />
          <SidebarLink
            icon={FileText}
            label="Q3 product brief"
            onClick={() => onView("/files")}
          />
          <SidebarLink
            icon={Image}
            label="Launch moodboard"
            onClick={() => onView("/files")}
          />
          <SidebarLink
            icon={Table2}
            label="Sprint planning"
            onClick={() => onView("/files")}
          />
          <SidebarLink
            icon={MessageCircle}
            label="# product"
            href="/messages/conv-channel-product"
            active={isActive("/messages", pathname)}
            onClick={onClose}
          />
        </SidebarGroup>
      </div>
      <button
        type="button"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#dedee0] bg-white text-[14px] text-[#555559] shadow-[0_2px_7px_rgba(0,0,0,0.05)] hover:bg-[#fdfdfd]"
        onClick={onCreate}
      >
        <PenLine className="size-4" /> New
      </button>
    </aside>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  active = false,
  muted = false,
  dot = false,
  href,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  active?: boolean;
  muted?: boolean;
  dot?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "flex h-8 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors",
    active
      ? "bg-[#e5e5e6] font-medium text-[#2e2e31]"
      : muted
        ? "text-[#9a9a9d] hover:bg-[#f0f0f1] hover:text-[#5b5b5e]"
        : "text-[#656568] hover:bg-[#e9e9ea] hover:text-[#2e2e31]",
  );
  const content = (
    <>
      <Icon
        className={cn(
          "size-[17px]",
          active ? "text-[#6e6e72]" : "text-[#969699]",
        )}
        strokeWidth={1.8}
      />
      {label}
      {dot ? (
        <span className="ml-auto size-1.5 rounded-full bg-[#6873dc]" />
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={className}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={className}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function SidebarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-3 text-[12px] font-medium text-[#9a9a9d]">
        {label}
      </h2>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}
