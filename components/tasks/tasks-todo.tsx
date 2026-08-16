"use client";

import { Bell, CalendarRange, Plus } from "pixelarticons/react";
import { useMemo, useState } from "react";

import {
  AssigneeAvatar,
  PriorityFlag,
  ProjectChip,
  priorityRank,
  TaskCheckbox,
  TaskIndicators,
} from "@/components/tasks/task-bits";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { addDays, dueLabel, isOverdue, startOfDay } from "./task-utils";

type TodoViewProps = {
  tasks: Task[];
  onCreate: (input: CreateTaskInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
};

type Group = {
  key: string;
  label: string;
  hint?: string;
  items: Task[];
};

export function TasksTodo({
  tasks,
  onCreate,
  onUpdate,
  onOpenEdit,
}: TodoViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);

  const groups = useMemo(() => buildGroups(tasks), [tasks]);

  async function submitQuick() {
    const title = quickTitle.trim();
    if (!title || quickBusy) return;
    setQuickBusy(true);
    try {
      await onCreate({ title });
      setQuickTitle("");
    } finally {
      setQuickBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <form
        className="flex items-center gap-3 rounded-2xl border border-[#e5e7ec] bg-white px-4 py-3 shadow-[0_2px_7px_rgba(32,41,60,0.025)]"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuick();
        }}
      >
        <Plus className="size-4 text-[#a1a8b5]" />
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task, then press Enter"
          aria-label="Add a task"
          className="w-full bg-transparent text-[13px] text-[#414a5d] outline-none placeholder:text-[#a1a8b5]"
        />
      </form>

      {tasks.some(
        (task) => task.reminderAt !== null && task.status !== "done",
      ) ? (
        <ReminderSection tasks={tasks} onOpenEdit={onOpenEdit} />
      ) : null}

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <GroupSection
            key={group.key}
            group={group}
            onUpdate={onUpdate}
            onOpenEdit={onOpenEdit}
          />
        ))}
      </div>
    </div>
  );
}

function ReminderSection({
  tasks,
  onOpenEdit,
}: {
  tasks: Task[];
  onOpenEdit: (task: Task) => void;
}) {
  const reminders = tasks
    .filter((task) => task.reminderAt !== null && task.status !== "done")
    .sort((a, b) => (a.reminderAt ?? 0) - (b.reminderAt ?? 0));
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#e6e4f4] bg-[#fbfaff] shadow-[0_2px_7px_rgba(32,41,60,0.02)]">
      <header className="flex items-center gap-2 border-b border-[#eeeef7] px-4 py-2.5">
        <Bell className="size-3.5 text-[#5b64d6]" />
        <h3 className="text-[12px] font-semibold text-[#4b5568]">Reminders</h3>
        <span className="text-[11px] text-[#a1a8b5]">{reminders.length}</span>
      </header>
      <div className="divide-y divide-[#eeeef7]">
        {reminders.map((task) => (
          <button
            key={task.id}
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white"
            onClick={() => onOpenEdit(task)}
          >
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#414a5d]">
              {task.title}
            </span>
            <span className="shrink-0 text-[11px] text-[#6f78a0]">
              {new Date(task.reminderAt ?? 0).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function buildGroups(tasks: Task[]): Group[] {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const undone = tasks
    .filter((t) => t.status !== "done")
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        (a.dueDate ?? Number.MAX_SAFE_INTEGER) -
          (b.dueDate ?? Number.MAX_SAFE_INTEGER),
    );
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const groups: Group[] = [
    {
      key: "overdue",
      label: "Overdue",
      items: undone.filter((t) => t.dueDate !== null && isOverdue(t.dueDate)),
    },
    {
      key: "today",
      label: "Today",
      hint: "Due today",
      items: undone.filter(
        (t) =>
          t.dueDate !== null &&
          startOfDay(new Date(t.dueDate)).getTime() === today.getTime(),
      ),
    },
    {
      key: "tomorrow",
      label: "Tomorrow",
      hint: "Due tomorrow",
      items: undone.filter(
        (t) =>
          t.dueDate !== null &&
          startOfDay(new Date(t.dueDate)).getTime() === tomorrow.getTime(),
      ),
    },
    {
      key: "later",
      label: "Later",
      hint: "Due this week or beyond",
      items: undone.filter(
        (t) =>
          t.dueDate !== null &&
          startOfDay(new Date(t.dueDate)).getTime() > tomorrow.getTime(),
      ),
    },
    {
      key: "no-date",
      label: "No due date",
      items: undone.filter((t) => t.dueDate === null),
    },
    {
      key: "done",
      label: "Done",
      items: done,
    },
  ];
  return groups.filter((g) => g.items.length > 0);
}

function GroupSection({
  group,
  onUpdate,
  onOpenEdit,
}: {
  group: Group;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
}) {
  const isDone = group.key === "done";
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
      <header className="flex items-center gap-2 border-b border-[#eff0f3] px-4 py-2.5">
        <span
          className={cn(
            "size-2 rounded-full",
            isDone
              ? "bg-[#4caf7d]"
              : group.key === "overdue"
                ? "bg-[#e5484d]"
                : "bg-[#5b64d6]",
          )}
        />
        <h3 className="text-[12px] font-semibold text-[#4b5568]">
          {group.label}
        </h3>
        <span className="text-[11px] text-[#a1a8b5]">{group.items.length}</span>
        {group.hint ? (
          <span className="ml-auto hidden text-[11px] text-[#a1a8b5] sm:block">
            {group.hint}
          </span>
        ) : null}
      </header>
      <div className="divide-y divide-[#f4f5f8]">
        {group.items.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#fafbff]"
          >
            <TaskCheckbox
              done={isDone}
              label={task.title}
              onToggle={() =>
                onUpdate(task.id, {
                  status: isDone ? "todo" : "done",
                })
              }
            />
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
              onClick={() => onOpenEdit(task)}
            >
              <PriorityFlag priority={task.priority} />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px]",
                  isDone
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
              <ProjectChip name={task.projectName} color={task.projectColor} />
              {task.dueDate ? (
                <span
                  className={cn(
                    "hidden shrink-0 items-center gap-1 text-[11px] sm:flex",
                    isDone || group.key !== "overdue"
                      ? "text-[#8c94a4]"
                      : "font-medium text-[#e5484d]",
                  )}
                >
                  <CalendarRange className="size-3" />
                  {dueLabel(task.dueDate)}
                </span>
              ) : null}
              <AssigneeAvatar user={task.assignee} size="sm" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
