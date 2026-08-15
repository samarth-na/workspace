"use client";

import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  FileText,
  Folder,
  Grid2X2,
  Image,
  Inbox,
  LayoutDashboard,
  List,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Settings2,
  Smile,
  Sparkles,
  Table2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View = "Home" | "Inbox" | "Messages" | "Files" | "Calls" | "People";

const navigation: {
  label: View;
  icon: typeof LayoutDashboard;
  count?: number;
}[] = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Inbox", icon: Inbox, count: 4 },
  { label: "Messages", icon: MessageCircle },
  { label: "Files", icon: Folder },
  { label: "Calls", icon: Video },
  { label: "People", icon: Users },
];

type FileTone = "indigo" | "orange" | "green" | "rose";
type FileItem = {
  name: string;
  type: string;
  size: string;
  updated: string;
  icon: typeof FileText;
  tone: FileTone;
};

const files: FileItem[] = [
  {
    name: "Q3 product brief",
    type: "Document",
    size: "2.4 MB",
    updated: "Updated 18 min ago",
    icon: FileText,
    tone: "indigo",
  },
  {
    name: "Launch moodboard",
    type: "Images",
    size: "18 items",
    updated: "Updated yesterday",
    icon: Image,
    tone: "orange",
  },
  {
    name: "Sprint planning",
    type: "Spreadsheet",
    size: "840 KB",
    updated: "Updated Aug 14",
    icon: Table2,
    tone: "green",
  },
  {
    name: "Team offsite 2026",
    type: "Presentation",
    size: "12 slides",
    updated: "Updated Aug 12",
    icon: FileText,
    tone: "rose",
  },
];

const people = [
  {
    name: "Maya Chen",
    role: "Product design",
    initials: "MC",
    color: "bg-[#f5c7b8]",
  },
  {
    name: "Jordan Lee",
    role: "Engineering",
    initials: "JL",
    color: "bg-[#c6d8f5]",
  },
  {
    name: "Priya Shah",
    role: "Product marketing",
    initials: "PS",
    color: "bg-[#ddd0f3]",
  },
  {
    name: "Alex Morgan",
    role: "Research",
    initials: "AM",
    color: "bg-[#d4e8cf]",
  },
];

export function WorkspaceShell({
  userName = "Samarth",
  isSignedIn = false,
}: {
  userName?: string;
  isSignedIn?: boolean;
}) {
  const [activeView, setActiveView] = useState<View>("Home");
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notice, setNotice] = useState("");

  const firstName = userName.split(" ")[0];
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <div className="flex min-h-dvh bg-[#f7f8fa] text-[#172033]">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e6e8ed] bg-[#fbfbfc] px-3 py-4 lg:flex">
        <div className="mb-7 flex items-center justify-between px-2">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-[#f0f1f4]"
            onClick={() => setShowProfile((value) => !value)}
          >
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#232b42] text-[13px] font-semibold text-white shadow-[0_2px_7px_rgba(35,43,66,0.18)]">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
                Cedar & Co.
              </span>
              <span className="block text-[11px] text-[#8991a3]">
                Workspace
              </span>
            </span>
            <ChevronDown className="ml-1 size-3.5 text-[#9299a8]" />
          </button>
          <button
            type="button"
            aria-label="Workspace settings"
            className="rounded-md p-1.5 text-[#9299a8] transition-colors hover:bg-[#f0f1f4] hover:text-[#4d5669]"
          >
            <Settings2 className="size-[15px]" />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Workspace navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.label;
            return (
              <button
                type="button"
                className={cn(
                  "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all",
                  active
                    ? "bg-[#eef0ff] text-[#4c56c4]"
                    : "text-[#687184] hover:bg-[#f0f1f4] hover:text-[#30394c]",
                )}
                key={item.label}
                onClick={() => setActiveView(item.label)}
              >
                <Icon
                  className={cn(
                    "size-[16px]",
                    active ? "text-[#5c66d8]" : "text-[#929aab]",
                  )}
                  strokeWidth={1.8}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count ? (
                  <span className="text-[11px] font-semibold text-[#6d75ca]">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a1a8b5]">
          Your workspace
        </div>
        <div className="space-y-1">
          <SidebarLink icon={FileText} label="Product notes" />
          <SidebarLink icon={Folder} label="Shared files" />
          <SidebarLink icon={CalendarDays} label="Team calendar" />
        </div>

        <div className="mt-auto border-t border-[#e9ebef] pt-3">
          <SidebarLink icon={CircleHelp} label="Help center" />
          <button
            type="button"
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f0f1f4]"
            onClick={() => setShowProfile((value) => !value)}
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

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#e6e8ed]/90 bg-[#f7f8fa]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg bg-[#232b42] text-[12px] font-semibold text-white lg:hidden"
              aria-label="Open workspace menu"
            >
              C
            </button>
            <div className="flex items-center gap-2 text-[13px] text-[#8c94a4]">
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden text-[#c4c8d0] sm:inline">/</span>
              <span className="font-medium text-[#3f4859]">{activeView}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-8 items-center gap-2 rounded-lg border border-[#e3e5ea] bg-white px-2.5 text-[12px] text-[#8991a0] shadow-[0_1px_2px_rgba(18,24,40,0.02)] transition hover:border-[#d6dae2] hover:text-[#5d6677] sm:flex"
              onClick={() => setShowSearch(true)}
            >
              <Search className="size-3.5" />
              <span>Search</span>
              <span className="ml-3 flex items-center gap-0.5 rounded border border-[#e6e8ec] px-1 text-[10px] text-[#9aa1ad]">
                <Command className="size-2.5" /> K
              </span>
            </button>
            <button
              type="button"
              aria-label="Search"
              className="flex size-8 items-center justify-center rounded-lg text-[#7f8797] hover:bg-white sm:hidden"
              onClick={() => setShowSearch(true)}
            >
              <Search className="size-[17px]" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-8 items-center justify-center rounded-lg text-[#7f8797] hover:bg-white"
              onClick={() => notify("You are all caught up")}
            >
              {" "}
              <Bell className="size-[16px]" strokeWidth={1.8} />
              <span className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-[#6873dc] ring-2 ring-[#f7f8fa]" />
            </button>
            <button
              type="button"
              aria-label="Create new"
              className="flex size-8 items-center justify-center rounded-lg bg-[#5b64d6] text-white shadow-[0_3px_9px_rgba(91,100,214,0.2)] hover:bg-[#4e57c5] sm:hidden"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="size-4" />
            </button>
            <Button
              className="hidden h-8 rounded-lg bg-[#5b64d6] px-3 text-[12px] font-semibold shadow-[0_3px_9px_rgba(91,100,214,0.2)] hover:bg-[#4e57c5] sm:flex"
              onClick={() => setShowCreate(true)}
            >
              {" "}
              <Plus className="size-3.5" /> New
            </Button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-[#d9d6f4] text-[10px] font-semibold text-[#514e9a]"
              onClick={() => setShowProfile((value) => !value)}
            >
              {getInitials(userName)}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1380px] px-5 pb-14 pt-8 sm:px-8 lg:px-12">
          {activeView === "Home" ? (
            <HomeView firstName={firstName} notify={notify} />
          ) : (
            <SecondaryView view={activeView} notify={notify} />
          )}
        </div>
      </main>

      {showCreate ? (
        <CreateMenu onClose={() => setShowCreate(false)} onAction={notify} />
      ) : null}
      {showSearch ? (
        <SearchDialog onClose={() => setShowSearch(false)} onAction={notify} />
      ) : null}
      {showProfile ? (
        <ProfileMenu
          userName={userName}
          isSignedIn={isSignedIn}
          onClose={() => setShowProfile(false)}
        />
      ) : null}
      {notice ? (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#232b42] px-4 py-3 text-[12px] font-medium text-white shadow-[0_12px_32px_rgba(35,43,66,0.2)]">
          <Check className="size-4 text-[#aab1ff]" />
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function HomeView({
  firstName,
  notify,
}: {
  firstName: string;
  notify: (message: string) => void;
}) {
  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[12px] font-medium text-[#8d95a5]">
            Saturday, August 15, 2026
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#20293c] sm:text-[32px]">
            Good morning, {firstName}
          </h1>
          <p className="mt-2 text-[14px] text-[#788193]">
            Here&apos;s what&apos;s happening across your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 border-[#e0e3e9] bg-white px-3 text-[12px] text-[#596275]"
            onClick={() => notify("Calendar opened")}
          >
            {" "}
            <CalendarDays className="size-3.5" /> Calendar
          </Button>
          <Button
            className="h-9 bg-[#232b42] px-3 text-[12px] text-white hover:bg-[#303a53]"
            onClick={() => notify("Starting a new call")}
          >
            {" "}
            <Video className="size-3.5" /> Start a call
          </Button>
        </div>
      </section>

      <section className="mb-7 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <div className="relative min-h-[254px] overflow-hidden rounded-2xl bg-[#242d47] p-6 text-white shadow-[0_12px_28px_rgba(36,45,71,0.12)] sm:p-7">
          <div className="absolute -right-8 -top-20 size-64 rounded-full border border-white/10" />
          <div className="absolute -right-1 -top-12 size-44 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.11em] text-[#b9c0ed]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#aeb7ff]" />{" "}
                  Live room
                </div>
                <h2 className="max-w-[430px] text-[24px] font-semibold leading-[1.1] tracking-[-0.035em]">
                  Weekly product sync is happening now
                </h2>
                <p className="mt-3 max-w-[430px] text-[13px] leading-5 text-[#b9c0d2]">
                  Maya is sharing the latest launch notes. Join the conversation
                  before it wraps.
                </p>
              </div>
              <button
                type="button"
                aria-label="More room options"
                className="rounded-lg p-1.5 text-[#9da7cb] hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AvatarStack />
                <span className="text-[12px] text-[#c5cbe0]">
                  6 people in the room
                </span>
              </div>
              <Button
                className="h-9 rounded-lg bg-white px-4 text-[12px] font-semibold text-[#2d3855] hover:bg-[#f0f1ff]"
                onClick={() => notify("Joining Weekly product sync")}
              >
                Join room <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex min-h-[254px] flex-col justify-between rounded-2xl border border-[#e5e7ec] bg-white p-6 shadow-[0_2px_7px_rgba(32,41,60,0.025)] sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#3d4658]">
                Today&apos;s focus
              </p>
              <p className="mt-1 text-[12px] text-[#9098a7]">
                Your team at a glance
              </p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#f0f1ff] text-[#6670d5]">
              <Sparkles className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-[38px] font-semibold tracking-[-0.06em] text-[#20293c]">
              12{" "}
              <span className="text-[14px] font-medium tracking-normal text-[#9098a7]">
                active threads
              </span>
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
              <div className="h-full w-[68%] rounded-full bg-[#727bdd]" />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[#969eac]">
              <span>8 resolved this week</span>
              <span>68%</span>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-[12px] font-semibold text-[#626dcc] hover:text-[#444dad]"
            onClick={() => notify("Opening your activity view")}
          >
            View activity <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={MessageCircle}
          label="Unread messages"
          value="24"
          detail="4 need your reply"
          tone="indigo"
        />
        <Metric
          icon={Folder}
          label="Files shared"
          value="148"
          detail="12 added this week"
          tone="green"
        />
        <Metric
          icon={Video}
          label="Calls this week"
          value="08"
          detail="2.4 hrs in meetings"
          tone="orange"
        />
        <Metric
          icon={Users}
          label="Team members"
          value="32"
          detail="3 new this month"
          tone="rose"
        />
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(290px,0.7fr)]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30394c]">
                Recent files
              </h2>
              <p className="mt-1 text-[12px] text-[#9299a8]">
                Everything your team has worked on lately.
              </p>
            </div>
            <button
              type="button"
              className="text-[12px] font-semibold text-[#6972cd] hover:text-[#4b55bd]"
              onClick={() => notify("Opening all files")}
            >
              View all
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
            <div className="hidden grid-cols-[minmax(210px,1.4fr)_0.8fr_0.7fr_32px] gap-4 border-b border-[#eff0f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a0a6b2] sm:grid">
              <span>Name</span>
              <span>Type</span>
              <span>Updated</span>
              <span />
            </div>
            {files.map((file) => (
              <FileRow file={file} key={file.name} onAction={notify} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30394c]">
                Upcoming
              </h2>
              <p className="mt-1 text-[12px] text-[#9299a8]">
                Your next few moments.
              </p>
            </div>
            <button
              type="button"
              className="text-[#8d95a5] hover:text-[#4d5669]"
              aria-label="More upcoming events"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            <EventCard
              time="10:30 AM"
              title="Weekly product sync"
              label="Now · 6 participants"
              live
            />
            <EventCard
              time="1:00 PM"
              title="Design critique"
              label="45 min · Product design"
            />
            <EventCard
              time="Tomorrow"
              title="All-hands meeting"
              label="9:00 AM · Everyone"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function SecondaryView({
  view,
  notify,
}: {
  view: Exclude<View, "Home">;
  notify: (message: string) => void;
}) {
  if (view === "Messages") return <MessagesView notify={notify} />;
  if (view === "Files") return <FilesView notify={notify} />;
  if (view === "Calls") return <CallsView notify={notify} />;
  if (view === "People") return <PeopleView notify={notify} />;
  return <InboxView notify={notify} />;
}

function InboxView({ notify }: { notify: (message: string) => void }) {
  return (
    <ViewFrame
      title="Inbox"
      description="Updates and mentions that need your attention."
      action="Mark all read"
      onAction={() => notify("Inbox marked as read")}
    >
      <div className="max-w-3xl overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
        <Notification
          title="Maya mentioned you in Product launch"
          detail="Can you review the final onboarding flow before Friday?"
          time="12 min ago"
          color="bg-[#f5c7b8]"
          initials="MC"
          unread
        />
        <Notification
          title="Jordan shared Q3 product brief"
          detail="Q3 product brief · 2.4 MB"
          time="1 hr ago"
          color="bg-[#c6d8f5]"
          initials="JL"
          unread
        />
        <Notification
          title="You were added to Design critique"
          detail="Tomorrow at 1:00 PM"
          time="Yesterday"
          color="bg-[#ddd0f3]"
          initials="PS"
        />
        <Notification
          title="Priya reacted to your message"
          detail="That direction feels right for the launch."
          time="Yesterday"
          color="bg-[#d4e8cf]"
          initials="PS"
        />
      </div>
    </ViewFrame>
  );
}

function MessagesView({ notify }: { notify: (message: string) => void }) {
  return (
    <ViewFrame
      title="Messages"
      description="Keep project conversations close to the work."
      action="New message"
      onAction={() => notify("New message composer opened")}
    >
      <div className="grid max-w-5xl gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#e5e7ec] bg-white p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
            Channels
          </p>
          {["# product", "# design", "# random"].map((name, index) => (
            <button
              type="button"
              key={name}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px]",
                index === 0
                  ? "bg-[#eef0ff] font-semibold text-[#535dc9]"
                  : "text-[#697184] hover:bg-[#f5f6f8]",
              )}
            >
              <span>{name}</span>
              {index === 0 ? (
                <span className="size-1.5 rounded-full bg-[#6973dc]" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#30394c]">
                # product
              </h3>
              <p className="mt-0.5 text-[11px] text-[#969eac]">
                Launch planning and product updates
              </p>
            </div>
            <Users className="size-4 text-[#9aa1ad]" />
          </div>
          <div className="flex-1 space-y-5 p-5">
            <ChatMessage
              initials="MC"
              color="bg-[#f5c7b8]"
              name="Maya Chen"
              time="10:14 AM"
              text="The new onboarding flow is ready for a final pass. I added the latest notes to the shared brief."
            />
            <ChatMessage
              initials="JL"
              color="bg-[#c6d8f5]"
              name="Jordan Lee"
              time="10:22 AM"
              text="Looks good from engineering. I can pair on the handoff after the sync."
            />
          </div>
          <div className="m-4 flex items-center gap-2 rounded-xl border border-[#e5e7ec] px-3 py-2">
            <Paperclip className="size-4 text-[#9aa1ad]" />
            <input
              aria-label="Write a message"
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a1a8b5]"
              placeholder="Write a message..."
            />
            <Smile className="size-4 text-[#9aa1ad]" />
            <button
              type="button"
              aria-label="Send message"
              className="flex size-7 items-center justify-center rounded-lg bg-[#5b64d6] text-white"
              onClick={() => notify("Message sent")}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </ViewFrame>
  );
}

function FilesView({ notify }: { notify: (message: string) => void }) {
  const [grid, setGrid] = useState(false);
  return (
    <ViewFrame
      title="Files"
      description="A shared home for documents, images, and project assets."
      action="Upload file"
      onAction={() => notify("File picker opened")}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-[#8c94a4]">
          <span className="font-medium text-[#4e576a]">All files</span>
          <span>/</span>
          <span>Shared with everyone</span>
        </div>
        <div className="flex rounded-lg border border-[#e2e4e9] bg-white p-0.5">
          <button
            type="button"
            aria-label="List view"
            className={cn(
              "rounded-md p-1.5",
              !grid ? "bg-[#eef0ff] text-[#5b64d6]" : "text-[#9aa1ad]",
            )}
            onClick={() => setGrid(false)}
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            className={cn(
              "rounded-md p-1.5",
              grid ? "bg-[#eef0ff] text-[#5b64d6]" : "text-[#9aa1ad]",
            )}
            onClick={() => setGrid(true)}
          >
            <Grid2X2 className="size-3.5" />
          </button>
        </div>
      </div>
      {grid ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {files.map((file) => (
            <FileCard file={file} key={file.name} onAction={notify} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
          <div className="hidden grid-cols-[minmax(210px,1.4fr)_0.8fr_0.7fr_32px] gap-4 border-b border-[#eff0f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a0a6b2] sm:grid">
            <span>Name</span>
            <span>Type</span>
            <span>Updated</span>
            <span />
          </div>
          {files
            .concat([
              {
                ...files[0],
                name: "Brand assets",
                type: "Folder",
                updated: "Updated Aug 08",
              },
            ])
            .map((file) => (
              <FileRow file={file} key={file.name} onAction={notify} />
            ))}
        </div>
      )}
    </ViewFrame>
  );
}

function CallsView({ notify }: { notify: (message: string) => void }) {
  return (
    <ViewFrame
      title="Calls"
      description="Start a focused room or pick up where your team left off."
      action="Start a call"
      onAction={() => notify("Starting a new call")}
    >
      <div className="grid max-w-5xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-[#242d47] p-7 text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b9c0ed]">
              <span className="size-1.5 rounded-full bg-[#aeb7ff]" /> Live now
            </span>
            <MoreVertical className="size-4 text-[#9da7cb]" />
          </div>
          <h2 className="mt-10 max-w-sm text-[25px] font-semibold leading-[1.12] tracking-[-0.04em]">
            Weekly product sync
          </h2>
          <p className="mt-3 text-[13px] text-[#b9c0d2]">
            6 people are in the room
          </p>
          <div className="mt-10 flex items-center justify-between">
            <AvatarStack />
            <Button
              className="h-9 bg-white px-4 text-[12px] font-semibold text-[#2d3855] hover:bg-[#f0f1ff]"
              onClick={() => notify("Joining Weekly product sync")}
            >
              Join call <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e5e7ec] bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#3d4658]">
              Recent calls
            </h3>
            <Clock3 className="size-4 text-[#9aa1ad]" />
          </div>
          <div className="mt-4 divide-y divide-[#eff0f3]">
            <CallRow title="Design critique" detail="Yesterday · 42 min" />
            <CallRow title="Sprint planning" detail="Aug 13 · 58 min" />
            <CallRow title="Customer research" detail="Aug 12 · 31 min" />
          </div>
        </div>
      </div>
    </ViewFrame>
  );
}

function PeopleView({ notify }: { notify: (message: string) => void }) {
  return (
    <ViewFrame
      title="People"
      description="Everyone who makes Cedar & Co. work."
      action="Invite people"
      onAction={() => notify("Invite link copied")}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {people.map((person) => (
          <div
            className="rounded-2xl border border-[#e5e7ec] bg-white p-5 shadow-[0_2px_7px_rgba(32,41,60,0.025)]"
            key={person.name}
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full text-[12px] font-semibold text-[#514e9a]",
                person.color,
              )}
            >
              {person.initials}
            </span>
            <h3 className="mt-4 text-[14px] font-semibold text-[#30394c]">
              {person.name}
            </h3>
            <p className="mt-1 text-[12px] text-[#9299a8]">{person.role}</p>
            <button
              type="button"
              className="mt-5 text-[12px] font-semibold text-[#6972cd] hover:text-[#4b55bd]"
              onClick={() => notify(`Opening a message with ${person.name}`)}
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </ViewFrame>
  );
}

function ViewFrame({
  title,
  description,
  action,
  onAction,
  children,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[12px] font-medium text-[#8d95a5]">
            Workspace
          </p>
          <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#20293c]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] text-[#788193]">{description}</p>
        </div>
        <Button
          className="h-9 w-fit bg-[#5b64d6] px-3 text-[12px] font-semibold hover:bg-[#4e57c5]"
          onClick={onAction}
        >
          <Plus className="size-3.5" /> {action}
        </Button>
      </div>
      {children}
    </section>
  );
}

function SidebarLink({
  icon: Icon,
  label,
}: {
  icon: typeof FileText;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-8 w-full items-center gap-3 rounded-lg px-3 text-[12px] text-[#7c8596] transition-colors hover:bg-[#f0f1f4] hover:text-[#30394c]"
    >
      <Icon className="size-[15px] text-[#a0a7b3]" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  detail: string;
  tone: "indigo" | "green" | "orange" | "rose";
}) {
  const tones = {
    indigo: "bg-[#eef0ff] text-[#6670d5]",
    green: "bg-[#eaf5ec] text-[#5b9a6b]",
    orange: "bg-[#fff1e5] text-[#d28a4d]",
    rose: "bg-[#fbecef] text-[#c87489]",
  };
  return (
    <div className="rounded-2xl border border-[#e5e7ec] bg-white p-4 shadow-[0_2px_7px_rgba(32,41,60,0.025)] sm:p-5">
      <span
        className={cn(
          "mb-5 flex size-8 items-center justify-center rounded-lg",
          tones[tone],
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="text-[12px] text-[#8991a1]">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.045em] text-[#30394c]">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#9da4b1]">{detail}</p>
    </div>
  );
}

function AvatarStack() {
  return (
    <div className="flex -space-x-2">
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] bg-[#f5c7b8] text-[9px] font-semibold text-[#805a51]">
        MC
      </span>
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] bg-[#c6d8f5] text-[9px] font-semibold text-[#52688c]">
        JL
      </span>
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] bg-[#ddd0f3] text-[9px] font-semibold text-[#675b93]">
        PS
      </span>
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] bg-[#4b5675] text-[9px] font-semibold text-white">
        +3
      </span>
    </div>
  );
}

function FileRow({
  file,
  onAction,
}: {
  file: FileItem;
  onAction: (message: string) => void;
}) {
  const Icon = file.icon;
  const tones = {
    indigo: "bg-[#eef0ff] text-[#6670d5]",
    orange: "bg-[#fff1e5] text-[#d28a4d]",
    green: "bg-[#eaf5ec] text-[#5b9a6b]",
    rose: "bg-[#fbecef] text-[#c87489]",
  };
  return (
    <button
      type="button"
      className="grid w-full grid-cols-1 gap-2 border-b border-[#eff0f3] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#fafaff] sm:grid-cols-[minmax(210px,1.4fr)_0.8fr_0.7fr_32px] sm:items-center sm:gap-4 sm:px-5"
      onClick={() => onAction(`Opening ${file.name}`)}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            tones[file.tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-[#414a5d]">
            {file.name}
          </span>
          <span className="mt-0.5 block text-[11px] text-[#a0a6b2] sm:hidden">
            {file.type} · {file.size}
          </span>
        </span>
      </span>
      <span className="hidden text-[12px] text-[#8f97a6] sm:block">
        {file.type}
      </span>
      <span className="hidden text-[12px] text-[#8f97a6] sm:block">
        {file.updated}
      </span>
      <MoreHorizontal className="hidden size-4 justify-self-end text-[#a6acb7] sm:block" />
    </button>
  );
}

function FileCard({
  file,
  onAction,
}: {
  file: FileItem;
  onAction: (message: string) => void;
}) {
  const Icon = file.icon;
  return (
    <button
      type="button"
      className="rounded-2xl border border-[#e5e7ec] bg-white p-4 text-left shadow-[0_2px_7px_rgba(32,41,60,0.025)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(32,41,60,0.06)]"
      onClick={() => onAction(`Opening ${file.name}`)}
    >
      <span className="flex h-28 items-center justify-center rounded-xl bg-[#f5f6f9]">
        <Icon className="size-8 text-[#8a93a5]" strokeWidth={1.4} />
      </span>
      <p className="mt-4 truncate text-[13px] font-semibold text-[#414a5d]">
        {file.name}
      </p>
      <p className="mt-1 text-[11px] text-[#9da4b1]">
        {file.type} · {file.size}
      </p>
    </button>
  );
}

function EventCard({
  time,
  title,
  label,
  live = false,
}: {
  time: string;
  title: string;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7ec] bg-white p-4 shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[11px] font-semibold",
            live ? "text-[#6872d4]" : "text-[#9299a8]",
          )}
        >
          {time}
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6d76d7]">
            <span className="size-1.5 rounded-full bg-[#6d76d7]" /> Live
          </span>
        ) : (
          <CalendarDays className="size-3.5 text-[#a1a8b5]" />
        )}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-[#414a5d]">{title}</p>
      <p className="mt-1 text-[11px] text-[#9aa1ad]">{label}</p>
    </div>
  );
}

function Notification({
  title,
  detail,
  time,
  color,
  initials,
  unread = false,
}: {
  title: string;
  detail: string;
  time: string;
  color: string;
  initials: string;
  unread?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#eff0f3] px-5 py-4 last:border-b-0">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#514e9a]",
          color,
        )}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#414a5d]">
          {title}
          {unread ? (
            <span className="ml-2 inline-block size-1.5 rounded-full bg-[#6873dc] align-middle" />
          ) : null}
        </p>
        <p className="mt-1 truncate text-[12px] text-[#9299a8]">{detail}</p>
      </div>
      <span className="shrink-0 text-[11px] text-[#a0a6b2]">{time}</span>
    </div>
  );
}

function ChatMessage({
  initials,
  color,
  name,
  time,
  text,
}: {
  initials: string;
  color: string;
  name: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-[#514e9a]",
          color,
        )}
      >
        {initials}
      </span>
      <div>
        <p className="text-[12px] font-semibold text-[#414a5d]">
          {name} <span className="ml-1 font-normal text-[#a0a6b2]">{time}</span>
        </p>
        <p className="mt-1 max-w-xl text-[13px] leading-5 text-[#6f7889]">
          {text}
        </p>
      </div>
    </div>
  );
}

function CallRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[12px] font-semibold text-[#4b5568]">{title}</p>
        <p className="mt-1 text-[11px] text-[#9aa1ad]">{detail}</p>
      </div>
      <button
        type="button"
        aria-label={`Call ${title}`}
        className="flex size-7 items-center justify-center rounded-lg text-[#7c85d6] hover:bg-[#eef0ff]"
      >
        <Phone className="size-3.5" />
      </button>
    </div>
  );
}

function CreateMenu({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (message: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-20">
      <button
        type="button"
        aria-label="Close create menu"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="absolute right-5 top-[62px] w-56 rounded-xl border border-[#e3e5ea] bg-white p-1.5 shadow-[0_12px_30px_rgba(35,43,66,0.13)] sm:right-8">
        <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
          Create new
        </p>
        <CreateItem
          icon={FileText}
          label="Document"
          onClick={() => {
            onAction("New document created");
            onClose();
          }}
        />
        <CreateItem
          icon={Upload}
          label="Upload files"
          onClick={() => {
            onAction("File picker opened");
            onClose();
          }}
        />
        <CreateItem
          icon={Video}
          label="Start a call"
          onClick={() => {
            onAction("Starting a new call");
            onClose();
          }}
        />
      </div>
    </div>
  );
}

function CreateItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
      onClick={onClick}
    >
      <Icon className="size-4 text-[#8b94a5]" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function SearchDialog({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (message: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-[#20293c]/10 px-4 pt-[15vh] backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e3e5ea] bg-white shadow-[0_20px_50px_rgba(35,43,66,0.16)]">
        <div className="flex items-center gap-3 border-b border-[#eff0f3] px-4">
          <Search className="size-4 text-[#9aa1ad]" />
          <input
            aria-label="Search workspace"
            className="h-14 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a1a8b5]"
            placeholder="Search people, files, or messages"
          />
          <button
            type="button"
            aria-label="Close search"
            className="rounded-md p-1 text-[#9aa1ad] hover:bg-[#f2f3f6]"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
            Quick access
          </p>
          <SearchResult
            icon={FileText}
            title="Q3 product brief"
            detail="Document · Shared files"
            onClick={() => {
              onAction("Opening Q3 product brief");
              onClose();
            }}
          />
          <SearchResult
            icon={MessageCircle}
            title="# product"
            detail="Channel · 3 unread messages"
            onClick={() => {
              onAction("Opening # product");
              onClose();
            }}
          />
          <SearchResult
            icon={Users}
            title="Maya Chen"
            detail="Person · Product design"
            onClick={() => {
              onAction("Opening Maya Chen's profile");
              onClose();
            }}
          />
        </div>
        <div className="flex items-center justify-between border-t border-[#eff0f3] px-4 py-3 text-[11px] text-[#9aa1ad]">
          <span>Search everything in Cedar & Co.</span>
          <span className="flex items-center gap-1">
            <Command className="size-3" /> Enter to open
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchResult({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-[#f5f6f9]"
      onClick={onClick}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f2f6] text-[#7f89a0]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[#4b5568]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] text-[#9aa1ad]">
          {detail}
        </span>
      </span>
      <ArrowUpRight className="size-3.5 text-[#b0b5bf]" />
    </button>
  );
}

function ProfileMenu({
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
