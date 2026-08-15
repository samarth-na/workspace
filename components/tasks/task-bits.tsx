"use client";

import { AtSign, Bell, Check, Flag, Paperclip } from "lucide-react";
import { useEffect, useRef } from "react";

import { PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import type { AvatarUser, TaskPriority, TaskStatus } from "@/lib/task-types";
import { cn } from "@/lib/utils";

export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  if (priority === "none") {
    return <Flag className="size-3.5 text-[#d3d5da]" strokeWidth={2} />;
  }
  const colors: Record<Exclude<TaskPriority, "none">, string> = {
    urgent: "text-[#e5484d]",
    high: "text-[#d97757]",
    medium: "text-[#c2913c]",
    low: "text-[#8f97a8]",
  };
  return <Flag className={cn("size-3.5", colors[priority])} strokeWidth={2} />;
}

export function StatusPill({
  status,
  onClick,
  className,
}: {
  status: TaskStatus;
  onClick?: () => void;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-colors",
        meta.bg,
        meta.text,
        onClick && "hover:brightness-[0.97]",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Comp>
  );
}

export function StatusMenu({
  status,
  onChange,
  onClose,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-10 mt-1 w-40 rounded-xl border border-[#e3e5ea] bg-white p-1 shadow-[0_12px_30px_rgba(35,43,66,0.13)]"
    >
      {Object.entries(STATUS_META).map(([value, meta]) => {
        const isActive = value === status;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-[#596275] transition-colors hover:bg-[#f4f5f8]"
            onClick={() => {
              onChange(value as TaskStatus);
              onClose();
            }}
          >
            <span className={cn("size-2 rounded-full", meta.dot)} />
            <span className="flex-1">{meta.label}</span>
            {isActive ? <Check className="size-3.5 text-[#5b64d6]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function AssigneeAvatar({
  user,
  size = "md",
}: {
  user: AvatarUser | null;
  size?: "sm" | "md";
}) {
  if (!user) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#f1f2f5] text-[#b0b6c2]",
          size === "sm" ? "size-5 text-[7px]" : "size-6 text-[9px]",
        )}
      >
        <Flag className={size === "sm" ? "size-2.5" : "size-3"} />
      </span>
    );
  }
  return (
    <span
      title={user.name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-5 text-[8px]" : "size-6 text-[9px]",
      )}
      style={{ backgroundColor: user.color }}
    >
      {user.initials}
    </span>
  );
}

export function TaskCheckbox({
  done,
  onToggle,
  label,
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={done ? `Mark ${label} as not done` : `Mark ${label} as done`}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
        done
          ? "border-[#4caf7d] bg-[#4caf7d] text-white"
          : "border-[#d3d5da] bg-white hover:border-[#5b64d6] hover:bg-[#f4f5ff]",
      )}
      onClick={onToggle}
    >
      {done ? <Check className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}

export function ProjectChip({
  name,
  color,
}: {
  name: string | null;
  color: string | null;
}) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f8] px-2 py-0.5 text-[11px] text-[#6b7486]">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color ?? "#b0b6c2" }}
      />
      {name}
    </span>
  );
}

export function TaskIndicators({
  attachmentCount,
  reminderAt,
  mentionCount = 0,
}: {
  attachmentCount: number;
  reminderAt: number | null;
  mentionCount?: number;
}) {
  if (attachmentCount === 0 && reminderAt === null && mentionCount === 0)
    return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[#a1a8b5]">
      {attachmentCount > 0 ? (
        <span
          className="flex items-center gap-0.5"
          title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}
        >
          <Paperclip className="size-3" />
          <span className="text-[10px]">{attachmentCount}</span>
        </span>
      ) : null}
      {reminderAt !== null ? (
        <span title={`Reminder ${new Date(reminderAt).toLocaleString()}`}>
          <Bell className="size-3" />
        </span>
      ) : null}
      {mentionCount > 0 ? (
        <span
          className="flex items-center gap-0.5"
          title={`${mentionCount} mention${mentionCount === 1 ? "" : "s"}`}
        >
          <AtSign className="size-3" />
          <span className="text-[10px]">{mentionCount}</span>
        </span>
      ) : null}
    </span>
  );
}

export function priorityRank(priority: TaskPriority): number {
  return PRIORITY_META[priority].rank;
}
