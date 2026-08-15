"use client";

import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  AssigneeAvatar,
  PriorityFlag,
  StatusPill,
} from "@/components/tasks/task-bits";
import type { Project, Task, UpdateTaskInput } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { addDays, daysBetween, startOfDay } from "./task-utils";

type TimelineViewProps = {
  tasks: Task[];
  projects: Project[];
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onOpenEdit: (task: Task) => void;
  onOpenCreate: (defaults?: { projectId?: string }) => void;
};

const DAY_WIDTH = 36;
const DAY_MS = 86_400_000;

type Adjust = {
  taskId: string;
  mode: "move" | "start" | "end";
  shift: number;
};

export function TasksTimeline({
  tasks,
  projects,
  onUpdate,
  onOpenEdit,
  onOpenCreate,
}: TimelineViewProps) {
  const today = startOfDay(new Date());
  const range = useMemo(() => computeRange(tasks, today), [tasks, today]);
  const dayCount = daysBetween(range.start, range.end) + 1;
  const totalWidth = dayCount * DAY_WIDTH;
  const [adjust, setAdjust] = useState<Adjust | null>(null);
  const session = useRef<{
    taskId: string;
    mode: "move" | "start" | "end";
    pointerId: number;
    startX: number;
    origStart: number;
    origDue: number;
    moved: boolean;
  } | null>(null);
  const suppressedRef = useRef(false);

  const dated = tasks.filter((t) => t.startDate !== null && t.dueDate !== null);
  const unscheduled = tasks.filter(
    (t) => t.startDate === null || t.dueDate === null,
  );

  const rows = useMemo(
    () =>
      projects.map((project) => ({
        project,
        lanes: layoutLanes(
          dated.filter((t) => t.projectId === project.id),
          range,
        ),
      })),
    [projects, dated, range],
  );

  const todayLeft = daysBetween(range.start, today) * DAY_WIDTH;

  function startSession(
    e: React.PointerEvent<HTMLElement>,
    task: Task,
    mode: "move" | "start" | "end",
  ) {
    if (task.startDate === null || task.dueDate === null) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    session.current = {
      taskId: task.id,
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      origStart: startOfDay(new Date(task.startDate)).getTime(),
      origDue: startOfDay(new Date(task.dueDate)).getTime(),
      moved: false,
    };
  }

  function moveSession(e: React.PointerEvent<HTMLElement>) {
    const s = session.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const shift = Math.round((e.clientX - s.startX) / DAY_WIDTH);
    if (shift !== 0) {
      s.moved = true;
      suppressedRef.current = true;
    }
    setAdjust({ taskId: s.taskId, mode: s.mode, shift });
  }

  function endSession(e: React.PointerEvent<HTMLElement>) {
    const s = session.current;
    if (!s || s.pointerId !== e.pointerId) return;
    if (s.moved) {
      const shift = Math.round((e.clientX - s.startX) / DAY_WIDTH);
      if (s.mode === "move") {
        onUpdate(s.taskId, {
          startDate: s.origStart + shift * DAY_MS,
          dueDate: s.origDue + shift * DAY_MS,
        });
      } else if (s.mode === "start") {
        onUpdate(s.taskId, {
          startDate: s.origStart + shift * DAY_MS,
        });
      } else {
        onUpdate(s.taskId, {
          dueDate: s.origDue + shift * DAY_MS,
        });
      }
    }
    session.current = null;
    setAdjust(null);
  }

  function effectiveDates(task: Task): { start: Date; end: Date } {
    const adj = adjust;
    if (adj && adj.taskId === task.id && task.startDate && task.dueDate) {
      const shift = adj.shift * DAY_MS;
      const baseStart = startOfDay(new Date(task.startDate)).getTime();
      const baseDue = startOfDay(new Date(task.dueDate)).getTime();
      if (adj.mode === "move") {
        return {
          start: new Date(baseStart + shift),
          end: new Date(baseDue + shift),
        };
      }
      if (adj.mode === "start") {
        const start = Math.min(baseStart + shift, baseDue - DAY_MS);
        return { start: new Date(start), end: new Date(baseDue) };
      }
      const due = Math.max(baseDue + shift, baseStart + DAY_MS);
      return { start: new Date(baseStart), end: new Date(due) };
    }
    return {
      start: startOfDay(new Date(task.startDate ?? 0)),
      end: startOfDay(new Date(task.dueDate ?? 0)),
    };
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
      <div className="border-b border-[#eff0f3] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-[#414a5d]">Timeline</h3>
          <p className="text-[12px] text-[#8c94a4]">
            Drag bars to move, drag edges to resize
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-[220px_1fr]">
            <div className="sticky left-0 z-10 border-r border-[#eff0f3] bg-white">
              <div className="h-9 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.06em] text-[#a1a8b5]">
                Project
              </div>
              {rows.map(({ project, lanes }) => (
                <ProjectRowLabel
                  key={project.id}
                  project={project}
                  laneCount={lanes.length}
                  onAdd={() => onOpenCreate({ projectId: project.id })}
                />
              ))}
            </div>

            <div className="relative">
              <div
                className="relative"
                style={{ width: totalWidth, height: "100%" }}
              >
                <DayHeader range={range.start} dayCount={dayCount} />
                {rows.map(({ project, lanes }) => (
                  <LaneArea
                    key={project.id}
                    laneCount={lanes.length}
                    todayLeft={todayLeft}
                    showToday={today >= range.start && today <= range.end}
                  >
                    {lanes.map((lane) => (
                      <div key={lane[0].id} className="relative h-8">
                        {lane.map((task) => {
                          if (
                            task.startDate === null ||
                            task.dueDate === null
                          ) {
                            return null;
                          }
                          const eff = effectiveDates(task);
                          const left =
                            daysBetween(range.start, eff.start) * DAY_WIDTH;
                          const width =
                            (daysBetween(eff.start, eff.end) + 1) * DAY_WIDTH;
                          const isAdjusting =
                            adjust?.taskId === task.id && adjust.shift !== 0;
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "absolute top-1 flex h-6 items-center overflow-hidden rounded-md transition-colors select-none",
                                isAdjusting &&
                                  "opacity-80 ring-2 ring-[#5b64d6]/50",
                              )}
                              style={{
                                left: left + 2,
                                width: Math.max(width - 4, 6),
                                backgroundColor: task.projectColor ?? "#b0b6c2",
                              }}
                            >
                              <button
                                type="button"
                                title={`${task.title} · ${task.projectName ?? "No project"} · drag to move`}
                                className="h-full min-w-0 flex-1 touch-none cursor-grab px-2 text-left active:cursor-grabbing"
                                style={{ touchAction: "none" }}
                                onPointerDown={(e) =>
                                  startSession(e, task, "move")
                                }
                                onPointerMove={moveSession}
                                onPointerUp={endSession}
                                onPointerCancel={() => {
                                  session.current = null;
                                  setAdjust(null);
                                }}
                                onClick={() => {
                                  if (suppressedRef.current) {
                                    suppressedRef.current = false;
                                    return;
                                  }
                                  onOpenEdit(task);
                                }}
                              >
                                <span
                                  className={cn(
                                    "block truncate text-[10px] font-medium text-white",
                                    width < 48 && "sr-only",
                                  )}
                                >
                                  {task.title}
                                </span>
                              </button>
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize"
                                style={{ touchAction: "none" }}
                                onPointerDown={(e) =>
                                  startSession(e, task, "start")
                                }
                                onPointerMove={moveSession}
                                onPointerUp={endSession}
                                onPointerCancel={() => {
                                  session.current = null;
                                  setAdjust(null);
                                }}
                              />
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize"
                                style={{ touchAction: "none" }}
                                onPointerDown={(e) =>
                                  startSession(e, task, "end")
                                }
                                onPointerMove={moveSession}
                                onPointerUp={endSession}
                                onPointerCancel={() => {
                                  session.current = null;
                                  setAdjust(null);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </LaneArea>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {unscheduled.length > 0 ? (
        <div className="border-t border-[#eff0f3]">
          <div className="flex items-center gap-2 px-5 py-2.5">
            <h3 className="text-[12px] font-semibold text-[#4b5568]">
              Unscheduled
            </h3>
            <span className="text-[11px] text-[#a1a8b5]">
              {unscheduled.length}
            </span>
          </div>
          <div className="divide-y divide-[#f4f5f8]">
            {unscheduled.map((task) => (
              <button
                key={task.id}
                type="button"
                className="flex w-full items-center gap-3 px-5 py-2 text-left transition-colors hover:bg-[#fafbff]"
                onClick={() => onOpenEdit(task)}
              >
                <PriorityFlag priority={task.priority} />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px]",
                    task.status === "done"
                      ? "text-[#a1a8b5] line-through"
                      : "font-medium text-[#414a5d]",
                  )}
                >
                  {task.title}
                </span>
                <StatusPill status={task.status} />
                <AssigneeAvatar user={task.assignee} size="sm" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DayHeader({ range, dayCount }: { range: Date; dayCount: number }) {
  const days = Array.from({ length: dayCount }, (_, i) => addDays(range, i));
  const cells: React.ReactNode[] = [];
  let lastMonth: number | null = null;
  for (const day of days) {
    const month = day.getMonth();
    const monthStart = lastMonth !== null && month !== lastMonth;
    cells.push(
      <div
        key={day.toISOString()}
        className={cn(
          "flex h-9 flex-col items-center justify-center border-l border-[#f1f2f5] text-[10px]",
          monthStart && "border-l-2 border-l-[#5b64d6]",
        )}
        style={{ width: DAY_WIDTH }}
      >
        <span className="font-medium text-[#596275]">{day.getDate()}</span>
        <span className="text-[9px] text-[#a1a8b5]">
          {day.toLocaleDateString("en-US", { weekday: "narrow" })}
        </span>
      </div>,
    );
    lastMonth = month;
  }
  return <div className="flex">{cells}</div>;
}

function ProjectRowLabel({
  project,
  laneCount,
  onAdd,
}: {
  project: Project;
  laneCount: number;
  onAdd: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 border-b border-[#f4f5f8] px-4"
      style={{ height: 8 + laneCount * 32 }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      <span className="flex-1 truncate text-[12px] font-medium text-[#414a5d]">
        {project.name}
      </span>
      <button
        type="button"
        aria-label={`Add task to ${project.name}`}
        className="flex size-6 items-center justify-center rounded-lg text-[#a1a8b5] transition-colors hover:bg-[#f4f5f8] hover:text-[#5b64d6]"
        onClick={onAdd}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function LaneArea({
  laneCount,
  todayLeft,
  showToday,
  children,
}: {
  laneCount: number;
  todayLeft: number;
  showToday: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative border-b border-[#f4f5f8]"
      style={{ height: 8 + laneCount * 32 }}
    >
      {showToday ? (
        <div
          className="pointer-events-none absolute inset-y-0 z-[5] w-px bg-[#e5484d]/60"
          style={{ left: todayLeft }}
        />
      ) : null}
      {children}
    </div>
  );
}

function layoutLanes(
  datedTasks: Task[],
  range: { start: Date; end: Date },
): Task[][] {
  const sorted = [...datedTasks].sort((a, b) => {
    const as = a.startDate ?? 0;
    const bs = b.startDate ?? 0;
    const ad = a.dueDate ?? as;
    const bd = b.dueDate ?? bs;
    return as - bs || ad - bd;
  });
  const lanes: Task[][] = [];
  for (const task of sorted) {
    if (task.startDate === null || task.dueDate === null) continue;
    const start = startOfDay(new Date(task.startDate));
    const end = startOfDay(new Date(task.dueDate));
    if (end < range.start || start > range.end) continue;
    let placed = false;
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (last.dueDate === null) continue;
      if (startOfDay(new Date(last.dueDate)) < start) {
        lane.push(task);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([task]);
    }
  }
  return lanes;
}

function computeRange(tasks: Task[], today: Date): { start: Date; end: Date } {
  const starts: number[] = [];
  const ends: number[] = [];
  for (const t of tasks) {
    if (t.startDate !== null) {
      starts.push(startOfDay(new Date(t.startDate)).getTime());
    }
    if (t.dueDate !== null) {
      ends.push(startOfDay(new Date(t.dueDate)).getTime());
    }
  }
  let start: Date;
  let end: Date;
  if (starts.length === 0 && ends.length === 0) {
    start = addDays(today, -7);
    end = addDays(today, 21);
  } else {
    start = starts.length > 0 ? new Date(Math.min(...starts)) : new Date(today);
    end = ends.length > 0 ? new Date(Math.max(...ends)) : new Date(today);
    if (start > today) start = today;
    if (end < addDays(today, 7)) end = addDays(today, 7);
    if (start > end) end = start;
  }
  return { start, end };
}
