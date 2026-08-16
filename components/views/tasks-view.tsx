"use client";

import {
  Calendar,
  ChartBarBig,
  CheckDouble,
  Grid2x3,
  ListBox,
  Plus,
} from "pixelarticons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShell } from "@/components/shell/shell-context";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksCalendar } from "@/components/tasks/tasks-calendar";
import { TasksList } from "@/components/tasks/tasks-list";
import { TasksTimeline } from "@/components/tasks/tasks-timeline";
import { TasksTodo } from "@/components/tasks/tasks-todo";
import { Button } from "@/components/ui/button";
import type {
  AvatarUser,
  CreateTaskInput,
  Project,
  Task,
  TaskStatus,
  TasksResponse,
  UpdateTaskInput,
} from "@/lib/task-types";
import { cn } from "@/lib/utils";

type ViewId = "list" | "board" | "todo" | "calendar" | "timeline";

const VIEWS: { id: ViewId; label: string; icon: typeof ListBox }[] = [
  { id: "list", label: "List", icon: ListBox },
  { id: "board", label: "Board", icon: Grid2x3 },
  { id: "todo", label: "Todo", icon: CheckDouble },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "timeline", label: "Timeline", icon: ChartBarBig },
];

type CreateDefaults = {
  dueDate?: number;
  startDate?: number;
  projectId?: string;
  status?: TaskStatus;
  title?: string;
  description?: string;
};

type DialogState =
  | { mode: "create"; defaults?: CreateDefaults }
  | { mode: "edit"; task: Task }
  | null;

export function TasksView({
  initialTitle,
  initialDescription,
  initialTaskId,
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialTaskId?: string;
}) {
  const { notify } = useShell();
  const [view, setView] = useState<ViewId>("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AvatarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const draftOpened = useRef(false);
  const taskOpened = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = (await res.json()) as TasksResponse;
      setTasks(data.tasks);
      setProjects(data.projects);
      setUsers(data.users);
    } catch {
      setError("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (draftOpened.current || !initialTitle) return;
    draftOpened.current = true;
    setDialog({
      mode: "create",
      defaults: { title: initialTitle, description: initialDescription },
    });
  }, [initialDescription, initialTitle]);

  useEffect(() => {
    if (taskOpened.current || !initialTaskId) return;
    const task = tasks.find((item) => item.id === initialTaskId);
    if (!task) return;
    taskOpened.current = true;
    setDialog({ mode: "edit", task });
  }, [initialTaskId, tasks]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  async function handleCreate(input: CreateTaskInput) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      if (res.status === 401) {
        notify("Sign in to create tasks");
      } else {
        notify("Could not create task");
      }
      throw new Error("Create failed");
    }
    notify("Task created");
    await refresh();
  }

  async function handleUpdate(id: string, input: UpdateTaskInput) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      notify("Could not update task");
      throw new Error("Update failed");
    }
    await refresh();
  }

  const activeView = VIEWS.find((v) => v.id === view) ?? VIEWS[0];

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#20293c]">
            Tasks
          </h1>
          <p className="mt-2 text-[14px] text-[#788193]">
            {tasks.length} task{tasks.length === 1 ? "" : "s"} across{" "}
            {projects.length} project{projects.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          className="h-9 w-fit bg-[#5b64d6] px-3 text-[12px] font-semibold hover:bg-[#4e57c5]"
          onClick={() => setDialog({ mode: "create" })}
        >
          <Plus className="size-3.5" /> New task
        </Button>
      </div>

      <div className="mb-4 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#e5e7ec] bg-white p-1 shadow-[0_1px_2px_rgba(32,41,60,0.03)]">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={view === item.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              view === item.id
                ? "bg-[#eef0ff] text-[#4e57c5]"
                : "text-[#8c94a4] hover:bg-[#f4f5f8] hover:text-[#414a5d]",
            )}
            onClick={() => setView(item.id)}
          >
            <item.icon className="size-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-[13px] text-[#9299a8]">
          Loading tasks…
        </p>
      ) : error ? (
        <p className="py-16 text-center text-[13px] text-[#e5484d]">{error}</p>
      ) : activeView.id === "list" ? (
        <TasksList
          tasks={tasks}
          projects={projects}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onOpenEdit={(task) => setDialog({ mode: "edit", task })}
        />
      ) : activeView.id === "board" ? (
        <TasksBoard
          tasks={tasks}
          onUpdate={handleUpdate}
          onOpenEdit={(task) => setDialog({ mode: "edit", task })}
          onOpenCreate={(defaults) => setDialog({ mode: "create", defaults })}
        />
      ) : activeView.id === "todo" ? (
        <TasksTodo
          tasks={tasks}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onOpenEdit={(task) => setDialog({ mode: "edit", task })}
        />
      ) : activeView.id === "calendar" ? (
        <TasksCalendar
          tasks={tasks}
          onUpdate={handleUpdate}
          onOpenEdit={(task) => setDialog({ mode: "edit", task })}
          onOpenCreate={(defaults) => setDialog({ mode: "create", defaults })}
        />
      ) : (
        <TasksTimeline
          tasks={tasks}
          projects={projects}
          onUpdate={handleUpdate}
          onOpenEdit={(task) => setDialog({ mode: "edit", task })}
          onOpenCreate={(defaults) => setDialog({ mode: "create", defaults })}
        />
      )}

      {dialog ? (
        <TaskDialog
          mode={dialog.mode}
          task={dialog.mode === "edit" ? dialog.task : null}
          projects={projects}
          users={users}
          defaultProjectId={
            dialog.mode === "create" ? dialog.defaults?.projectId : null
          }
          defaultStatus={
            dialog.mode === "create" ? dialog.defaults?.status : undefined
          }
          defaultTitle={
            dialog.mode === "create" ? dialog.defaults?.title : undefined
          }
          defaultDescription={
            dialog.mode === "create" ? dialog.defaults?.description : undefined
          }
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            if (dialog.mode === "create") {
              await handleCreate({
                ...input,
                dueDate: input.dueDate ?? dialog.defaults?.dueDate ?? null,
                startDate:
                  input.startDate ?? dialog.defaults?.startDate ?? null,
                projectId:
                  input.projectId ?? dialog.defaults?.projectId ?? null,
                status: input.status ?? dialog.defaults?.status ?? "todo",
              });
            } else {
              await handleUpdate(dialog.task.id, input);
            }
          }}
        />
      ) : null}
    </section>
  );
}
