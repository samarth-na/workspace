"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import type {
  AvatarUser,
  CreateTaskInput,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/task-types";

type DialogProps = {
  mode: "create" | "edit";
  task: Task | null;
  projects: Project[];
  users: AvatarUser[];
  defaultProjectId?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
};

function toDateInputValue(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromDateInputValue(value: string): number | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

export function TaskDialog({
  mode,
  task,
  projects,
  users,
  defaultProjectId,
  onClose,
  onSubmit,
}: DialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "none",
  );
  const [projectId, setProjectId] = useState<string>(
    task?.projectId ?? defaultProjectId ?? "",
  );
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(
    toDateInputValue(task?.dueDate ?? null),
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(task?.startDate ?? null),
  );
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = title.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        status,
        priority,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        dueDate: fromDateInputValue(dueDate),
        startDate: fromDateInputValue(startDate),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20">
      <button
        type="button"
        aria-label="Close task dialog"
        className="absolute inset-0 cursor-default bg-[#20293c]/20"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "New task" : "Edit task"}
        className="absolute left-1/2 top-1/2 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e3e5ea] bg-white p-5 shadow-[0_20px_50px_rgba(35,43,66,0.2)]"
      >
        <form onSubmit={handleSubmit}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
            {mode === "create" ? "New task" : "Edit task"}
          </p>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            aria-label="Task title"
            className="mt-3 w-full rounded-lg border border-[#e3e5ea] bg-[#fafbfc] px-3 py-2 text-[14px] text-[#30394c] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#5b64d6] focus:bg-white focus:ring-3 focus:ring-[#5b64d6]/10"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                aria-label="Status"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              >
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                aria-label="Priority"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              >
                {Object.entries(PRIORITY_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Project">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                aria-label="Project"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignee">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                aria-label="Assignee"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Due date"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
                className="select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-[12px] text-[#596275]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || saving}
              className="bg-[#5b64d6] text-[12px] font-semibold hover:bg-[#4e57c5]"
            >
              {saving ? "Saving…" : mode === "create" ? "Create task" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block text-[11px] font-medium text-[#8c94a4]">
      <p className="mb-1">{label}</p>
      {children}
    </div>
  );
}
