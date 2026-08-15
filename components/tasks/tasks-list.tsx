"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  AssigneeAvatar,
  PriorityFlag,
  ProjectChip,
  priorityRank,
  StatusMenu,
  StatusPill,
  TaskCheckbox,
  TaskIndicators,
} from "@/components/tasks/task-bits";
import { STATUS_META, STATUS_ORDER } from "@/lib/task-meta";
import type {
  CreateTaskInput,
  Project,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { dueLabel, isOverdue } from "./task-utils";

type ListViewProps = {
  tasks: Task[];
  projects: Project[];
  onCreate: (input: CreateTaskInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
};

const FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_META[status].label,
  })),
];

export function TasksList({
  tasks,
  onCreate,
  onUpdate,
  onOpenEdit,
}: ListViewProps) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickBusy, setQuickBusy] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickOpen) quickRef.current?.focus();
  }, [quickOpen]);

  const visible = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => {
      if (filter === "all") {
        const byStatus =
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (byStatus !== 0) return byStatus;
      }
      const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
      if (byPriority !== 0) return byPriority;
      return (
        (a.dueDate ?? Number.MAX_SAFE_INTEGER) -
        (b.dueDate ?? Number.MAX_SAFE_INTEGER)
      );
    });

  async function submitQuick() {
    const title = quickTitle.trim();
    if (!title || quickBusy) return;
    setQuickBusy(true);
    try {
      await onCreate({ title });
      setQuickTitle("");
      setQuickOpen(false);
    } finally {
      setQuickBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#eff0f3] px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
              filter === f.value
                ? "bg-[#e5e5e6] text-[#2e2e31]"
                : "text-[#8c94a4] hover:bg-[#f4f5f8] hover:text-[#414a5d]",
            )}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="ml-1.5 text-[11px] opacity-60">
              {f.value === "all"
                ? tasks.length
                : tasks.filter((t) => t.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="hidden grid-cols-[minmax(280px,1fr)_160px_120px_90px_120px] items-center gap-4 border-b border-[#eff0f3] px-5 py-2 text-[10px] font-medium uppercase tracking-[0.06em] text-[#a1a8b5] md:grid">
        <span>Task</span>
        <span>Project</span>
        <span>Assignee</span>
        <span>Due</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-[#eff0f3]">
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#9299a8]">
            No tasks
            {filter !== "all"
              ? ` in ${STATUS_META[filter].label.toLowerCase()}`
              : ""}{" "}
            yet.
          </p>
        ) : (
          visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              menuOpen={menuTaskId === task.id}
              onToggleMenu={() =>
                setMenuTaskId(menuTaskId === task.id ? null : task.id)
              }
              onCloseMenu={() => setMenuTaskId(null)}
              onStatus={(status) =>
                onUpdate(task.id, { status }).then(() => setMenuTaskId(null))
              }
              onToggleDone={() =>
                onUpdate(task.id, {
                  status: task.status === "done" ? "todo" : "done",
                })
              }
              onOpen={() => onOpenEdit(task)}
            />
          ))
        )}
      </div>

      <div className="border-t border-[#eff0f3] px-3 py-2">
        {quickOpen ? (
          <form
            className="flex items-center gap-2 px-2 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              submitQuick();
            }}
          >
            <span className="size-[18px] shrink-0 rounded-[5px] border border-transparent" />
            <input
              ref={quickRef}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onBlur={() => {
                if (!quickTitle.trim()) setQuickOpen(false);
              }}
              placeholder="Task title, then press Enter"
              aria-label="New task title"
              className="w-full rounded-lg border border-[#e3e5ea] bg-[#fafbfc] px-2.5 py-1.5 text-[13px] text-[#30394c] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#5b64d6] focus:bg-white focus:ring-3 focus:ring-[#5b64d6]/10"
            />
            <span className="text-[11px] text-[#a1a8b5]">Enter to add</span>
          </form>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[#a1a8b5] transition-colors hover:bg-[#fafbfc] hover:text-[#596275]"
            onClick={() => setQuickOpen(true)}
          >
            <Plus className="size-3.5" /> New task
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onStatus,
  onToggleDone,
  onOpen,
}: {
  task: Task;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onStatus: (status: TaskStatus) => void;
  onToggleDone: () => void;
  onOpen: () => void;
}) {
  const done = task.status === "done";
  const overdue = task.dueDate !== null && isOverdue(task.dueDate) && !done;
  return (
    <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#fafbff] md:grid-cols-[minmax(280px,1fr)_160px_120px_90px_120px] md:gap-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <TaskCheckbox done={done} label={task.title} onToggle={onToggleDone} />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={onOpen}
        >
          <PriorityFlag priority={task.priority} />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px]",
              done
                ? "text-[#a1a8b5] line-through"
                : "font-medium text-[#414a5d]",
            )}
          >
            {task.title}
          </span>
          <TaskIndicators
            attachmentCount={task.attachments.length}
            reminderAt={task.reminderAt}
            mentionCount={task.mentions.length}
          />
          <span className="md:hidden">
            <ProjectChip name={task.projectName} color={task.projectColor} />
          </span>
        </button>
      </div>
      <button
        type="button"
        className="hidden justify-self-start text-left md:block"
        onClick={onOpen}
      >
        <ProjectChip name={task.projectName} color={task.projectColor} />
      </button>
      <button
        type="button"
        aria-label={`Assigned to ${task.assignee?.name ?? "no one"}`}
        className="hidden justify-self-start md:block"
        onClick={onOpen}
      >
        <AssigneeAvatar user={task.assignee} size="sm" />
      </button>
      <button
        type="button"
        className={cn(
          "hidden text-left text-[12px] md:block",
          overdue ? "font-medium text-[#e5484d]" : "text-[#8c94a4]",
        )}
        onClick={onOpen}
      >
        {task.dueDate ? dueLabel(task.dueDate) : "—"}
      </button>
      <span className="relative flex justify-end md:justify-start">
        <StatusPill status={task.status} onClick={onToggleMenu} />
        {menuOpen ? (
          <StatusMenu
            status={task.status}
            onChange={onStatus}
            onClose={onCloseMenu}
          />
        ) : null}
      </span>
    </div>
  );
}
