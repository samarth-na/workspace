"use client";

import { Attachment, Close, FileText, Search } from "pixelarticons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FileItem, FolderContentsResponse } from "@/lib/file-types";
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
  defaultStatus?: TaskStatus;
  defaultTitle?: string;
  defaultDescription?: string;
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
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function toDateTimeInputValue(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fromDateTimeInputValue(value: string): number | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskDialog({
  mode,
  task,
  projects,
  users,
  defaultProjectId,
  defaultStatus,
  defaultTitle,
  defaultDescription,
  onClose,
  onSubmit,
}: DialogProps) {
  const [title, setTitle] = useState(task?.title ?? defaultTitle ?? "");
  const [description, setDescription] = useState(
    task?.description ?? defaultDescription ?? "",
  );
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaultStatus ?? "todo",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "none",
  );
  const [projectId, setProjectId] = useState(
    task?.projectId ?? defaultProjectId ?? "",
  );
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(
    toDateInputValue(task?.dueDate ?? null),
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(task?.startDate ?? null),
  );
  const [reminderAt, setReminderAt] = useState(
    toDateTimeInputValue(task?.reminderAt ?? null),
  );
  const [mentionIds, setMentionIds] = useState<string[]>(
    task?.mentions.map((user) => user.id) ?? [],
  );
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!filesOpen || files.length > 0) return;
    let cancelled = false;
    setFilesLoading(true);
    fetch("/api/files?folder=all")
      .then((response) => response.json() as Promise<FolderContentsResponse>)
      .then((data) => {
        if (!cancelled) setFiles(data.files);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filesOpen, files.length]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(fileQuery.toLowerCase()),
  );
  const mentionUsers = users.filter((user) =>
    user.name.toLowerCase().includes((mentionQuery ?? "").toLowerCase()),
  );
  const canSubmit = title.trim().length > 0;

  function updateDescription(value: string) {
    setDescription(value);
    const textarea = descriptionRef.current;
    const caret = textarea?.selectionStart ?? value.length;
    const beforeCaret = value.slice(0, caret);
    const match = beforeCaret.match(/(?:^|\s)@([^\s@]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function selectMention(user: AvatarUser) {
    const textarea = descriptionRef.current;
    const caret = textarea?.selectionStart ?? description.length;
    const beforeCaret = description.slice(0, caret);
    const match = beforeCaret.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) return;
    const start = caret - match[1].length - 1;
    const next = `${description.slice(0, start)}@${user.name} ${description.slice(caret)}`;
    setDescription(next);
    setMentionIds((current) =>
      current.includes(user.id) ? current : [...current, user.id],
    );
    setMentionQuery(null);
    window.requestAnimationFrame(() => {
      const element = descriptionRef.current;
      if (!element) return;
      element.focus();
      const nextCaret = start + user.name.length + 2;
      element.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function toggleFile(file: FileItem) {
    if (task?.attachments.some((attachment) => attachment.fileId === file.id)) {
      return;
    }
    setAttachmentIds((current) =>
      current.includes(file.id)
        ? current.filter((id) => id !== file.id)
        : [...current, file.id],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        dueDate: fromDateInputValue(dueDate),
        startDate: fromDateInputValue(startDate),
        reminderAt: fromDateTimeInputValue(reminderAt),
        mentions: mentionIds,
        attachFileIds: attachmentIds,
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
        className="absolute left-1/2 top-1/2 max-h-[92vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e3e5ea] bg-white p-5 shadow-[0_20px_50px_rgba(35,43,66,0.2)]"
      >
        <form onSubmit={handleSubmit}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
            {mode === "create" ? "New task" : "Edit task"}
          </p>
          <input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            aria-label="Task title"
            className="mt-3 w-full rounded-lg border border-[#e3e5ea] bg-[#fafbfc] px-3 py-2 text-[14px] text-[#30394c] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#5b64d6] focus:bg-white focus:ring-3 focus:ring-[#5b64d6]/10"
          />

          <div className="relative mt-3">
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(event) => updateDescription(event.target.value)}
              placeholder="Add details. Type @ to ping a teammate."
              aria-label="Task description"
              rows={3}
              className="w-full resize-none rounded-lg border border-[#e3e5ea] bg-[#fafbfc] px-3 py-2 text-[13px] leading-5 text-[#414a5d] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#5b64d6] focus:bg-white focus:ring-3 focus:ring-[#5b64d6]/10"
            />
            {mentionQuery !== null ? (
              <div
                role="listbox"
                aria-label="Mention a teammate"
                className="absolute left-2 top-full z-10 mt-1 w-56 rounded-xl border border-[#e3e5ea] bg-white p-1 shadow-[0_12px_30px_rgba(35,43,66,0.13)]"
              >
                {mentionUsers.length > 0 ? (
                  mentionUsers.slice(0, 6).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      role="option"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectMention(user)}
                    >
                      <span
                        className="flex size-6 items-center justify-center rounded-full text-[8px] font-semibold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </span>
                      {user.name}
                    </button>
                  ))
                ) : (
                  <p className="px-2.5 py-2 text-[12px] text-[#a1a8b5]">
                    No teammate found
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                aria-label="Status"
                className={controlClass}
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
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                aria-label="Priority"
                className={controlClass}
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
                onChange={(event) => setProjectId(event.target.value)}
                aria-label="Project"
                className={controlClass}
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
                onChange={(event) => setAssigneeId(event.target.value)}
                aria-label="Assignee"
                className={controlClass}
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
                onChange={(event) => setDueDate(event.target.value)}
                aria-label="Due date"
                className={controlClass}
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-label="Start date"
                className={controlClass}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Reminder">
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(event) => setReminderAt(event.target.value)}
                  aria-label="Reminder date and time"
                  className={`${controlClass} flex-1`}
                />
                {reminderAt ? (
                  <button
                    type="button"
                    className="rounded-lg px-2 text-[11px] text-[#8c94a4] hover:bg-[#f4f5f8] hover:text-[#596275]"
                    onClick={() => setReminderAt("")}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </Field>
          </div>

          <div className="mt-4 rounded-xl border border-[#e9ebef] bg-[#fafbfc] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Attachment className="size-3.5 text-[#8c94a4]" />
                <span className="text-[12px] font-medium text-[#596275]">
                  Attachments
                </span>
                {task?.attachments.length ? (
                  <span className="text-[11px] text-[#a1a8b5]">
                    {task.attachments.length}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-[11px] font-medium text-[#5b64d6] hover:bg-[#eef0ff]"
                onClick={() => setFilesOpen(true)}
              >
                Attach uploaded file
              </button>
            </div>
            {task?.attachments.length || attachmentIds.length ? (
              <div className="mt-2 space-y-1.5">
                {task?.attachments.map((attachment) => (
                  <a
                    key={attachment.fileId}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-[11px] text-[#596275] hover:bg-[#f4f5f8]"
                  >
                    <FileText className="size-3.5 text-[#8c94a4]" />
                    <span className="min-w-0 flex-1 truncate">
                      {attachment.name}
                    </span>
                    <span className="text-[#a1a8b5]">
                      {formatFileSize(attachment.size)}
                    </span>
                  </a>
                ))}
                {attachmentIds.map((fileId) => {
                  const file = files.find((item) => item.id === fileId);
                  if (!file) return null;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-lg bg-[#eef0ff] px-2.5 py-2 text-[11px] text-[#596275]"
                    >
                      <FileText className="size-3.5 text-[#5b64d6]" />
                      <span className="min-w-0 flex-1 truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="text-[#8c94a4] hover:text-[#e5484d]"
                        onClick={() => toggleFile(file)}
                      >
                        <Close className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-[#a1a8b5]">
                Link files that already exist in Files.
              </p>
            )}
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
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Create task"
                  : "Save"}
            </Button>
          </div>
        </form>

        {filesOpen ? (
          <div className="fixed inset-0 z-30">
            <button
              type="button"
              aria-label="Close file picker"
              className="absolute inset-0 cursor-default bg-[#20293c]/20"
              onClick={() => setFilesOpen(false)}
            />
            <div className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e3e5ea] bg-white p-4 shadow-[0_20px_50px_rgba(35,43,66,0.2)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#414a5d]">
                  Choose uploaded files
                </h2>
                <button
                  type="button"
                  aria-label="Close file picker"
                  className="rounded-lg p-1 text-[#8c94a4] hover:bg-[#f4f5f8]"
                  onClick={() => setFilesOpen(false)}
                >
                  <Close className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e3e5ea] px-2.5 py-2">
                <Search className="size-3.5 text-[#a1a8b5]" />
                <input
                  value={fileQuery}
                  onChange={(event) => setFileQuery(event.target.value)}
                  aria-label="Search uploaded files"
                  placeholder="Search files"
                  className="min-w-0 flex-1 text-[12px] text-[#414a5d] outline-none placeholder:text-[#a1a8b5]"
                />
              </div>
              <div className="mt-3 max-h-64 overflow-y-auto">
                {filesLoading ? (
                  <p className="py-8 text-center text-[12px] text-[#a1a8b5]">
                    Loading files...
                  </p>
                ) : filteredFiles.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFiles.map((file) => {
                      const selected =
                        attachmentIds.includes(file.id) ||
                        Boolean(
                          task?.attachments.some(
                            (attachment) => attachment.fileId === file.id,
                          ),
                        );
                      return (
                        <button
                          key={file.id}
                          type="button"
                          aria-pressed={selected}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[#f4f5f8]"
                          onClick={() => toggleFile(file)}
                        >
                          <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef0f3]">
                            <FileText className="size-3.5 text-[#8c94a4]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] text-[#596275]">
                              {file.name}
                            </span>
                            <span className="block text-[10px] text-[#a1a8b5]">
                              {formatFileSize(file.size)}
                            </span>
                          </span>
                          <span
                            className={`flex size-4 items-center justify-center rounded border text-[10px] ${selected ? "border-[#5b64d6] bg-[#5b64d6] text-white" : "border-[#d3d5da]"}`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-[12px] text-[#a1a8b5]">
                    No uploaded files found.
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  className="bg-[#5b64d6] text-[12px] hover:bg-[#4e57c5]"
                  onClick={() => setFilesOpen(false)}
                >
                  Attach selected
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const controlClass =
  "select-appearance w-full rounded-lg border border-[#e3e5ea] bg-white px-2.5 py-2 text-[13px] text-[#414a5d] outline-none transition focus:border-[#5b64d6] focus:ring-3 focus:ring-[#5b64d6]/10";

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
