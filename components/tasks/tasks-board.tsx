"use client";

import { Plus } from "lucide-react";

import {
  AssigneeAvatar,
  PriorityFlag,
  ProjectChip,
  priorityRank,
  TaskIndicators,
} from "@/components/tasks/task-bits";
import { useDragDrop } from "@/components/tasks/use-drag-drop";
import { STATUS_META, STATUS_ORDER } from "@/lib/task-meta";
import type { Task, TaskStatus, UpdateTaskInput } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { dueLabel, isOverdue } from "./task-utils";

type BoardViewProps = {
  tasks: Task[];
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
  onOpenCreate: (defaults?: { status?: TaskStatus }) => void;
};

export function TasksBoard({
  tasks,
  onUpdate,
  onOpenEdit,
  onOpenCreate,
}: BoardViewProps) {
  const { draggingId, overId, bindPointerHandlers, wasDragging } = useDragDrop({
    onDrop: (taskId, dropId) => {
      const status = dropId.replace(/^status:/, "") as TaskStatus;
      if (STATUS_META[status]) onUpdate(taskId, { status });
    },
  });

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {STATUS_ORDER.map((status) => {
          const column = STATUS_META[status];
          const items = tasks
            .filter((t) => t.status === status)
            .sort(
              (a, b) =>
                priorityRank(a.priority) - priorityRank(b.priority) ||
                (a.dueDate ?? Number.MAX_SAFE_INTEGER) -
                  (b.dueDate ?? Number.MAX_SAFE_INTEGER),
            );
          const isOver = overId === `status:${status}`;
          return (
            <section
              key={status}
              data-drop-id={`status:${status}`}
              className={cn(
                "flex w-[248px] shrink-0 flex-col rounded-2xl border bg-[#fafbfc] transition-colors",
                isOver ? "border-[#5b64d6] bg-[#f4f5ff]" : "border-[#e5e7ec]",
              )}
            >
              <header className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className={cn("size-2 rounded-full", column.dot)} />
                <h3 className="text-[12px] font-semibold text-[#4b5568]">
                  {column.label}
                </h3>
                <span className="text-[11px] text-[#a1a8b5]">
                  {items.length}
                </span>
              </header>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((task) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    dragging={draggingId === task.id}
                    onPointerHandlers={bindPointerHandlers(task.id)}
                    onClick={() => {
                      if (wasDragging()) return;
                      onOpenEdit(task);
                    }}
                  />
                ))}
                {items.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[11px] text-[#b0b6c2]">
                    No tasks
                  </p>
                ) : null}
              </div>
              <footer className="border-t border-[#eff0f3] px-2 py-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[#a1a8b5] transition-colors hover:bg-[#f1f2f5] hover:text-[#596275]"
                  onClick={() => onOpenCreate({ status })}
                >
                  <Plus className="size-3.5" /> Add task
                </button>
              </footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  task,
  dragging,
  onPointerHandlers,
  onClick,
}: {
  task: Task;
  dragging: boolean;
  onPointerHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
  };
  onClick: () => void;
}) {
  const overdue = task.dueDate !== null && isOverdue(task.dueDate);
  return (
    <button
      type="button"
      {...onPointerHandlers}
      onClick={onClick}
      className={cn(
        "w-full touch-none rounded-xl border border-[#e6e8ee] bg-white p-3 text-left shadow-[0_1px_2px_rgba(32,41,60,0.04)] transition-all select-none hover:border-[#d6dae2] hover:shadow-[0_3px_8px_rgba(32,41,60,0.07)]",
        dragging && "scale-[0.97] opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="pt-0.5">
          <PriorityFlag priority={task.priority} />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 text-[13px] leading-snug",
            task.status === "done"
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
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <ProjectChip name={task.projectName} color={task.projectColor} />
        <span className="ml-auto flex items-center gap-2">
          {task.dueDate ? (
            <span
              className={cn(
                "text-[11px]",
                overdue && task.status !== "done"
                  ? "font-medium text-[#e5484d]"
                  : "text-[#8c94a4]",
              )}
            >
              {dueLabel(task.dueDate)}
            </span>
          ) : null}
          <AssigneeAvatar user={task.assignee} size="sm" />
        </span>
      </div>
    </button>
  );
}
