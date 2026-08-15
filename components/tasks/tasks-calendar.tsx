"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { PriorityFlag } from "@/components/tasks/task-bits";
import { useDragDrop } from "@/components/tasks/use-drag-drop";
import type { Task, UpdateTaskInput } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import {
  addDays,
  dayKey,
  isSameDay,
  monthLabel,
  startOfDay,
} from "./task-utils";

type CalendarViewProps = {
  tasks: Task[];
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
  onOpenCreate: (defaults?: { dueDate?: number; startDate?: number }) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateFromDayKey(key: string): Date | null {
  const [year, month, day] = key.split("-").map(Number);
  if ([year, month, day].some((n) => !Number.isFinite(n))) return null;
  return new Date(year, month, day);
}

export function TasksCalendar({
  tasks,
  onUpdate,
  onOpenEdit,
  onOpenCreate,
}: CalendarViewProps) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState<Date>(new Date(today));

  const { draggingId, overId, bindPointerHandlers, wasDragging } = useDragDrop({
    onDrop: (taskId, dropId) => {
      const key = dropId.replace(/^day:/, "");
      const date = dateFromDayKey(key);
      if (date) onUpdate(taskId, { dueDate: date.getTime() });
    },
  });

  const cells = useMemo(() => buildMonth(cursor), [cursor]);
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dayKey(startOfDay(new Date(task.dueDate)));
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          Number(a.status === "done") - Number(b.status === "done"),
      );
    }
    return map;
  }, [tasks]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
      <div className="flex items-center justify-between border-b border-[#eff0f3] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[#414a5d]">
          {monthLabel(cursor)}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            className="flex size-7 items-center justify-center rounded-lg text-[#8c94a4] transition-colors hover:bg-[#f4f5f8] hover:text-[#414a5d]"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#8c94a4] transition-colors hover:bg-[#f4f5f8] hover:text-[#414a5d]"
            onClick={() => setCursor(new Date(today))}
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="flex size-7 items-center justify-center rounded-lg text-[#8c94a4] transition-colors hover:bg-[#f4f5f8] hover:text-[#414a5d]"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#eff0f3]">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-[0.06em] text-[#a1a8b5]"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const key = dayKey(date);
          const dropId = `day:${key}`;
          const dayTasks = byDay.get(key) ?? [];
          const inMonth = date.getMonth() === cursor.getMonth();
          const isToday = isSameDay(date, today);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isOver = overId === dropId;
          return (
            <div
              key={key}
              data-drop-id={dropId}
              className={cn(
                "min-h-[92px] border-b border-r border-[#f1f2f5] p-1.5 transition-colors last:border-r-0",
                !inMonth && "bg-[#fafbfc]",
                isWeekend && inMonth && "bg-[#fcfcfd]",
                isOver &&
                  "bg-[#eef0ff] ring-1 ring-[#5b64d6]/50 ring-inset",
              )}
            >
              <button
                type="button"
                aria-label={`Add task on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[12px] transition-colors hover:bg-[#eef0ff]",
                  isToday
                    ? "bg-[#5b64d6] font-semibold text-white hover:bg-[#4e57c5]"
                    : inMonth
                      ? "text-[#4b5568]"
                      : "text-[#c4c8d2]",
                )}
                onClick={() => onOpenCreate({ dueDate: date.getTime() })}
              >
                {date.getDate()}
              </button>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    {...bindPointerHandlers(task.id)}
                    onClick={() => {
                      if (wasDragging()) return;
                      onOpenEdit(task);
                    }}
                    className={cn(
                      "flex w-full touch-none items-center gap-1.5 rounded-md bg-[#f4f5f8] px-1.5 py-1 text-left transition-all select-none hover:bg-[#e9ebf1]",
                      draggingId === task.id && "scale-[0.96] opacity-40",
                    )}
                  >
                    <PriorityFlag priority={task.priority} />
                    <span
                      className={cn(
                        "truncate text-[11px]",
                        task.status === "done"
                          ? "text-[#a1a8b5] line-through"
                          : "text-[#596275]",
                      )}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
                {dayTasks.length > 3 ? (
                  <p className="px-1.5 text-[10px] text-[#a1a8b5]">
                    +{dayTasks.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMonth(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = first.getDay();
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
