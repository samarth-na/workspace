"use client";

import Link from "next/link";
import {
  Bulletlist,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  type FileText,
  Folder,
  Home,
  InfoBox,
  Message,
  Pencil,
  Plus,
  Settings2,
  Users,
  Video,
} from "pixelarticons/react";
import { useEffect, useState } from "react";
import { NewMeetingDialog } from "@/components/meetings/new-meeting-dialog";
import { Avatar } from "@/components/shared/avatar";
import { MeetingSidebarItem } from "@/components/shell/meeting-sidebar-item";
import type { RecentItemDto } from "@/lib/recents-data";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

const NAV_ITEMS: { href: string; icon: typeof FileText; label: string }[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/tasks", icon: Bulletlist, label: "Tasks" },
  { href: "/messages", icon: Message, label: "Messages" },
  { href: "/files", icon: Folder, label: "Files" },
  { href: "/calls", icon: Video, label: "Calls" },
  { href: "/people", icon: Users, label: "People" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMessagesPath(pathname: string) {
  return pathname === "/messages" || pathname.startsWith("/messages/");
}

export function DesktopSidebar({
  pathname,
  unread,
}: {
  pathname: string;
  unread: { messages: boolean };
}) {
  const { workspaceName, workspaceLogo, notify, navigate } = useShell();
  const [collapsed, setCollapsed] = useState(false);
  const [meetingsOpen, setMeetingsOpen] = useState(true);
  const [showNewMeeting, setShowNewMeeting] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("cw-sidebar-collapsed") === "1") {
      setCollapsed(true);
    }
    if (window.localStorage.getItem("cw-meetings-open") === "0") {
      setMeetingsOpen(false);
    }
  }, []);

  const toggleMeetings = () => {
    setMeetingsOpen((current) => {
      window.localStorage.setItem("cw-meetings-open", current ? "0" : "1");
      return !current;
    });
  };

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      window.localStorage.setItem("cw-sidebar-collapsed", current ? "0" : "1");
      return !current;
    });
  };

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-[var(--bg-border-color)] bg-[var(--bg-sidebar-color)] py-4 transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[64px] px-2" : "w-[248px] px-3"
      }`}
    >
      <div
        className={`mb-7 ${
          collapsed
            ? "flex flex-col items-center gap-3"
            : "flex items-center justify-between px-2"
        }`}
      >
        <button
          type="button"
          className="flex min-w-0 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-[#f0f1f4]"
          onClick={() => navigate("/settings")}
        >
          {workspaceLogo ? (
            <img
              src={workspaceLogo}
              alt=""
              className="size-8 shrink-0 rounded-[9px] object-cover"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#9cb8f7] text-[12px] font-semibold text-[#31518e]">
              {workspaceName.slice(0, 1).toUpperCase()}
            </span>
          )}
          {!collapsed ? (
            <>
              <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
                {workspaceName}
              </span>
              <ChevronDown className="ml-1 size-3.5 shrink-0 text-[#9299a8]" />
            </>
          ) : null}
        </button>
        <div className={collapsed ? "flex flex-col gap-1" : "flex gap-0.5"}>
          <button
            type="button"
            aria-label="Workspace settings"
            className="rounded-md p-1.5 text-[#9299a8] transition-colors hover:bg-[#f0f1f4] hover:text-[#4d5669]"
            onClick={() => navigate("/settings")}
          >
            <Settings2 className="size-[15px]" />
          </button>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-[#9299a8] transition-colors hover:bg-[#f0f1f4] hover:text-[#4d5669]"
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <ChevronRight className="size-[15px]" />
            ) : (
              <ChevronLeft className="size-[15px]" />
            )}
          </button>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className={collapsed ? "mb-5 space-y-0.5" : "mb-5"}
      >
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href, pathname)}
            collapsed={collapsed}
            dot={
              item.href === "/messages" &&
              unread.messages &&
              !isMessagesPath(pathname)
            }
          />
        ))}
      </nav>

      {collapsed ? null : (
        <>
          <div className="rounded-xl bg-[#e9e9ea] px-2.5 py-2">
            <div className="flex items-center justify-between text-[13px] font-medium text-[#4f4f52]">
              <button
                type="button"
                aria-expanded={meetingsOpen}
                className="flex items-center gap-1.5 hover:text-[#2e2e31]"
                onClick={toggleMeetings}
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 text-[#949497] transition-transform duration-150",
                    !meetingsOpen && "-rotate-90",
                  )}
                />{" "}
                Meetings
              </button>
            </div>
            {meetingsOpen ? (
              <>
                <MeetingSidebarItem onOpen={(href) => navigate(href)} />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-1.5 py-2 text-left text-[#2e2e31] hover:bg-[#e9e9ea] hover:font-medium"
                  onClick={() => setShowNewMeeting(true)}
                >
                  <Plus className="size-4" />{" "}
                  <span className="text-[13px]">New meeting note</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-1.5 py-1 text-left text-[#2e2e31] hover:bg-[#e9e9ea] hover:font-medium"
                  onClick={() => navigate("/meetings")}
                >
                  <ExternalLink className="size-4" />{" "}
                  <span className="text-[13px]">View all</span>
                </button>
              </>
            ) : null}
          </div>

          <div className="workspace-sidebar-scroll mt-6 flex-1 overflow-y-auto pr-1">
            <RecentsGroup pathname={pathname} />
          </div>

          <div className="mt-auto border-t border-[#e9ebef] pt-3">
            <SidebarLink
              icon={InfoBox}
              label="Help center"
              onClick={() => notify("Help center opened")}
            />
          </div>
        </>
      )}
      {showNewMeeting ? (
        <NewMeetingDialog
          onClose={() => setShowNewMeeting(false)}
          onNotify={notify}
        />
      ) : null}
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
  unread: { messages: boolean };
  onClose: () => void;
  onCreate: () => void;
  onProfile: () => void;
  onView: (href: string) => void;
}) {
  const { userName, userImage, workspaceName, notify } = useShell();
  const [meetingsOpen, setMeetingsOpen] = useState(true);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  return (
    <aside className="relative z-10 flex h-full w-[min(88vw,360px)] flex-col bg-[#f8f8f9] px-3 py-4 shadow-[12px_0_30px_rgba(32,32,36,0.1)]">
      <div className="mb-6 flex items-center justify-between px-2">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-[#eeeeef]"
          onClick={onProfile}
        >
          <Avatar
            src={userImage}
            name={userName}
            className="size-8 rounded-[9px] bg-[#9cb8f7] text-[12px] text-[#31518e]"
          />
          <span>
            <span className="block text-[15px] font-medium text-[#353538]">
              {workspaceName}
            </span>
            <span className="block text-[11px] text-[#9a9a9d]">{userName}</span>
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
      <nav aria-label="Primary" className="mb-5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href, pathname)}
            dot={
              item.href === "/messages" &&
              unread.messages &&
              !isMessagesPath(pathname)
            }
            onClick={onClose}
          />
        ))}
      </nav>
      <div className="rounded-xl bg-[#ececed] px-2.5 py-2">
        <div className="flex items-center justify-between text-[14px] text-[#4d4d50]">
          <button
            type="button"
            aria-expanded={meetingsOpen}
            className="flex items-center gap-1.5 hover:text-[#2e2e31]"
            onClick={() => setMeetingsOpen((current) => !current)}
          >
            <ChevronDown
              className={cn(
                "size-3.5 text-[#949497] transition-transform duration-150",
                !meetingsOpen && "-rotate-90",
              )}
            />{" "}
            Meetings
          </button>
        </div>
        {meetingsOpen ? (
          <>
            <MeetingSidebarItem mobile onOpen={(href) => onView(href)} />
            <button
              type="button"
              className="flex w-full items-center gap-3 px-1.5 py-2 text-left text-[#2e2e31] hover:bg-[#ececed] hover:font-medium"
              onClick={() => setShowNewMeeting(true)}
            >
              <Plus className="size-4" />
              <span className="text-[14px]">New meeting note</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-1.5 py-1 text-left text-[#2e2e31] hover:bg-[#ececed] hover:font-medium"
              onClick={() => onView("/meetings")}
            >
              <ExternalLink className="size-4" />
              <span className="text-[14px]">View all</span>
            </button>
          </>
        ) : null}
      </div>
      <div className="workspace-sidebar-scroll mt-7 flex-1 overflow-y-auto px-1">
        <RecentsGroup pathname={pathname} onOpen={onClose} />
      </div>
      <button
        type="button"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#dedee0] bg-white text-[14px] text-[#555559] shadow-[0_2px_7px_rgba(0,0,0,0.05)] hover:bg-[#fdfdfd]"
        onClick={onCreate}
      >
        <Pencil className="size-4" /> New
      </button>
      {showNewMeeting ? (
        <NewMeetingDialog
          onClose={() => setShowNewMeeting(false)}
          onNotify={notify}
        />
      ) : null}
    </aside>
  );
}

const RECENT_ICONS: Record<RecentItemDto["type"], typeof FileText> = {
  conversation: Message,
  meeting: Video,
  folder: Folder,
};

function isRecentActive(
  item: RecentItemDto,
  pathname: string,
  folderParam: string | null,
) {
  if (item.type === "folder") {
    return pathname === "/files" && folderParam === item.itemId;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function useRecents(pathname: string): RecentItemDto[] {
  const [items, setItems] = useState<RecentItemDto[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch recents when the route changes
  useEffect(() => {
    let cancelled = false;
    fetch("/api/recents")
      .then((res) => (res.ok ? res.json() : { recents: [] }))
      .then((data: { recents?: RecentItemDto[] }) => {
        if (!cancelled) setItems(data.recents ?? []);
      })
      .catch(() => {
        // sidebar stays quiet if recents cannot load
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  return items;
}

function RecentsGroup({
  pathname,
  collapsed = false,
  onOpen,
}: {
  pathname: string;
  collapsed?: boolean;
  onOpen?: () => void;
}) {
  const recents = useRecents(pathname);
  const [folderParam, setFolderParam] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-read the folder query param when the route changes
  useEffect(() => {
    setFolderParam(new URLSearchParams(window.location.search).get("folder"));
  }, [pathname]);

  if (collapsed || recents.length === 0) return null;

  return (
    <SidebarGroup label="Recents">
      {recents.map((item) => (
        <SidebarLink
          key={item.id}
          icon={RECENT_ICONS[item.type]}
          label={item.title}
          href={item.href}
          active={isRecentActive(item, pathname, folderParam)}
          onClick={onOpen}
        />
      ))}
    </SidebarGroup>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  active = false,
  dot = false,
  collapsed = false,
  href,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  active?: boolean;
  dot?: boolean;
  collapsed?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "flex h-8 w-full items-center rounded-lg text-left text-[13px] text-[#2e2e31] transition-colors",
    collapsed ? "justify-center" : "gap-3 px-3",
    active
      ? "bg-[#e5e5e6] font-medium"
      : "hover:bg-[#e9e9ea] hover:font-medium",
  );
  const content = (
    <>
      <Icon className="size-[17px] shrink-0 text-[#45454a]" />
      {collapsed ? null : (
        <span className="min-w-0 flex-1 truncate">{label}</span>
      )}
      {dot ? (
        <span
          className={cn(
            "size-1.5 rounded-full bg-[#6873dc]",
            collapsed ? "absolute" : "ml-auto",
          )}
        />
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(className, dot && collapsed ? "relative" : undefined)}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(className, dot && collapsed ? "relative" : undefined)}
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
      <div>{children}</div>
    </section>
  );
}
