"use client";

import {
  ArrowUpRight,
  FileAudio,
  FileText,
  FileVideo,
  Image,
  Presentation,
  Search,
  Table2,
  Video,
} from "lucide-react";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import type { FileItem } from "@/lib/file-types";
import type { HomeData, HomeTaskItem } from "@/lib/home-data";
import type { MeetingSummary } from "@/lib/meeting-types";
import { STATUS_META } from "@/lib/task-meta";

const KIND_META = {
  image: { label: "Image", icon: Image, tone: "bg-[#fef0e5] text-[#d97757]" },
  pdf: { label: "PDF", icon: FileText, tone: "bg-[#fbeae8] text-[#d65a52]" },
  spreadsheet: {
    label: "Spreadsheet",
    icon: Table2,
    tone: "bg-[#e7f4ea] text-[#4caf7d]",
  },
  presentation: {
    label: "Presentation",
    icon: Presentation,
    tone: "bg-[#f3e8fb] text-[#8b5cf6]",
  },
  video: {
    label: "Video",
    icon: FileVideo,
    tone: "bg-[#e2e9f7] text-[#5b64d6]",
  },
  audio: {
    label: "Audio",
    icon: FileAudio,
    tone: "bg-[#e2e9f7] text-[#5b64d6]",
  },
  document: {
    label: "Document",
    icon: FileText,
    tone: "bg-[#eef0f3] text-[#7d8494]",
  },
} as const;

type FileKind = keyof typeof KIND_META;

function kindFor(item: { mimeType: string; name: string }): FileKind {
  const mime = item.mimeType;
  const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet") || ["csv", "xls", "xlsx"].includes(ext)) {
    return "spreadsheet";
  }
  if (mime.includes("presentation") || ["ppt", "pptx", "key"].includes(ext)) {
    return "presentation";
  }
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function dayDiff(timestamp: number, now: Date): number {
  return Math.round(
    (startOfDay(new Date(timestamp)) - startOfDay(now)) / 86_400_000,
  );
}

function dueLabel(timestamp: number, now: Date): string {
  const diff = dayDiff(timestamp, now);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function whenLabel(timestamp: number, now: Date): string {
  const diff = dayDiff(timestamp, now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const text = value >= 100 ? `${Math.round(value)}` : value.toFixed(1);
  return `${text} ${units[unit]}`;
}

export function HomeView({
  userName,
  workspaceName,
  tasks,
  meetings,
  files,
}: HomeData & { userName: string; workspaceName: string }) {
  const { notify, navigate, openSearch } = useShell();
  const firstName = userName.split(" ")[0];
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--bg-border-color)] bg-[var(--color-bg-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between border-b border-[#ededee] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-medium text-[#99999c]">
            {workspaceName}
          </p>
          <h1
            className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#29292c]"
            suppressHydrationWarning
          >
            {greeting}, {firstName}
          </h1>
          <p
            className="mt-0.5 text-[11px] text-[#a0a0a3]"
            suppressHydrationWarning
          >
            {dateLabel}
          </p>
        </div>
        <button
          type="button"
          aria-label="Search workspace"
          className="flex size-8 items-center justify-center rounded-lg text-[#89898c] hover:bg-[#f0f0f1] hover:text-[#454548]"
          onClick={openSearch}
        >
          <Search className="size-[17px]" strokeWidth={1.8} />
        </button>
      </div>

      <div className="border-b border-[#ededee] px-5 py-5 sm:px-6">
        <SectionHeader
          title="My tasks"
          hint={tasks.length > 0 ? `${tasks.length} open` : undefined}
          actionLabel="View all"
          onAction={() => navigate("/tasks")}
        />
        {tasks.length === 0 ? (
          <EmptyState
            message="No open tasks. You're all caught up."
            actionLabel="Create a task"
            onAction={() => navigate("/tasks")}
          />
        ) : (
          <div className="divide-y divide-[#eeeeef]">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                now={now}
                onClick={() => navigate(`/tasks?task=${task.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-[#ededee] px-5 py-5 sm:px-6">
        <SectionHeader
          title="Today's meetings"
          hint={meetings.length > 0 ? `${meetings.length} upcoming` : undefined}
          actionLabel="Open calendar"
          onAction={() => navigate("/calls")}
        />
        {meetings.length === 0 ? (
          <EmptyState
            message="Nothing scheduled for today."
            actionLabel="Schedule a meeting"
            onAction={() => navigate("/calls")}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {meetings.map((meeting) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                now={now}
                onJoin={() => {
                  navigate("/calls");
                  notify(`Joining ${meeting.title}`);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-5 sm:px-6">
        <SectionHeader
          title="Recent files"
          actionLabel="View all"
          onAction={() => navigate("/files")}
        />
        {files.length === 0 ? (
          <EmptyState
            message="No files yet. Uploads will appear here."
            actionLabel="Open files"
            onAction={() => navigate("/files")}
          />
        ) : (
          <div className="divide-y divide-[#eeeeef]">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                now={now}
                onClick={() => navigate("/files")}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-[12px] font-semibold text-[#4b4b4e]">{title}</h2>
        {hint ? (
          <span className="rounded-full bg-[#f0f0f1] px-2 py-0.5 text-[10px] font-medium text-[#8f8f93]">
            {hint}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="text-[11px] text-[#8d8d91] hover:text-[#47474a]"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-lg border border-dashed border-[#e3e3e5] bg-[#fbfbfc] px-4 py-5">
      <p className="text-[12px] text-[#8f8f93]">{message}</p>
      <button
        type="button"
        className="text-[11px] font-medium text-[#535dc9] hover:text-[#3d47a8]"
        onClick={onAction}
      >
        {actionLabel} →
      </button>
    </div>
  );
}

function TaskRow({
  task,
  now,
  onClick,
}: {
  task: HomeTaskItem;
  now: Date;
  onClick: () => void;
}) {
  const status = STATUS_META[task.status];
  const due = task.dueDate ? dueLabel(task.dueDate, now) : null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[#fafafa]"
      onClick={onClick}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{
          backgroundColor: task.projectColor ?? "#c9c9cd",
        }}
      />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#3d3d40]">
        {task.title}
      </span>
      <span
        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline ${status.text} ${status.bg}`}
      >
        {status.label}
      </span>
      {due ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            due === "Overdue"
              ? "bg-[#fbeae8] text-[#c4453c]"
              : due === "Today" || due === "Tomorrow"
                ? "bg-[#e2e9f7] text-[#31518e]"
                : "bg-[#f1f1f3] text-[#8f8f93]"
          }`}
        >
          {due}
        </span>
      ) : null}
      <ArrowUpRight className="hidden size-4 shrink-0 text-[#b0b0b3] sm:block" />
    </button>
  );
}

function MeetingRow({
  meeting,
  now,
  onJoin,
}: {
  meeting: MeetingSummary;
  now: Date;
  onJoin: () => void;
}) {
  const isLive = meeting.status === "live";
  const participants = meeting.members.length;
  const startedMinAgo = Math.max(
    0,
    Math.floor((now.getTime() - meeting.startsAt) / 60_000),
  );
  const timeText = isLive
    ? "Live now"
    : meeting.startsAt <= now.getTime()
      ? `Started ${startedMinAgo} min ago`
      : timeLabel(meeting.startsAt);

  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-[#e6e6e7] bg-[#fbfbfc] px-4 py-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          isLive ? "bg-[#e4f3e9] text-[#56a878]" : "bg-[#f0f0f1] text-[#7d8494]"
        }`}
      >
        <Video className="size-[17px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#363639]">
          {meeting.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8f8f93]">
          {isLive ? (
            <span className="size-1.5 rounded-full bg-[#56a878]" />
          ) : null}
          <span className="truncate">
            {timeText} · {participants} participant
            {participants === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      {meeting.members.length > 0 ? (
        <div className="hidden -space-x-1.5 sm:flex">
          {meeting.members.slice(0, 4).map((member) => (
            <span
              key={member.id}
              className="flex size-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-semibold text-[#514e9a]"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </span>
          ))}
        </div>
      ) : null}
      <Button
        className={`h-8 rounded-lg px-3 text-[12px] font-medium ${
          isLive
            ? "bg-[#e4f3e9] text-[#3d7a5a] hover:bg-[#d8ecdf]"
            : "bg-[#f0f0f1] text-[#3e3e41] hover:bg-[#e5e5e6]"
        }`}
        onClick={onJoin}
      >
        {isLive ? "Join live" : "Join"}
      </Button>
    </div>
  );
}

function FileRow({
  file,
  now,
  onClick,
}: {
  file: FileItem;
  now: Date;
  onClick: () => void;
}) {
  const kind = KIND_META[kindFor(file)];
  const Icon = kind.icon;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[#fafafa]"
      onClick={onClick}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}
      >
        <Icon className="size-4" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#3d3d40]">
          {file.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#98989b] sm:hidden">
          {kind.label} · {formatBytes(file.size)} ·{" "}
          {whenLabel(file.createdAt, now)}
        </span>
      </span>
      <span className="hidden text-[12px] text-[#77777b] sm:block">
        {kind.label}
      </span>
      <span className="hidden text-[12px] text-[#8f8f93] sm:block">
        {formatBytes(file.size)}
      </span>
      <span className="hidden text-[12px] text-[#8f8f93] sm:block">
        {whenLabel(file.createdAt, now)}
      </span>
      <ArrowUpRight className="hidden size-4 shrink-0 text-[#b0b0b3] sm:block" />
    </button>
  );
}
