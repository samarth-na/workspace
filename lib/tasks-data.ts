import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
} from "drizzle-orm";

import { db } from "@/db";
import { file } from "@/db/files";
import { user } from "@/db/schema";
import {
  notification,
  project,
  task,
  taskAttachment,
  taskMention,
} from "@/db/tasks";
import { avatarUserFor } from "@/lib/chat-data";
import { fileUrl } from "@/lib/file-url";
import type {
  AppNotification,
  CreateTaskInput,
  Task,
  TaskAttachment,
} from "@/lib/task-types";
import { workspaceMemberIds } from "@/lib/workspace-data";

export type { SessionUser } from "@/lib/chat-data";

export async function fetchProjects(workspaceId: string | null) {
  const rows = await db
    .select()
    .from(project)
    .where(workspaceId ? eq(project.workspaceId, workspaceId) : undefined)
    .orderBy(project.createdAt);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function fetchWorkspaceUsers(workspaceId: string | null) {
  const memberIds = workspaceId ? await workspaceMemberIds(workspaceId) : null;
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(memberIds ? inArray(user.id, memberIds) : undefined)
    .orderBy(user.name);
  return rows.map(avatarUserFor);
}

export async function fetchAttachments(
  taskIds: string[],
  workspaceId: string | null,
): Promise<Map<string, TaskAttachment[]>> {
  const map = new Map<string, TaskAttachment[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({
      taskId: taskAttachment.taskId,
      fileId: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      storedName: file.storedName,
      createdAt: taskAttachment.createdAt,
    })
    .from(taskAttachment)
    .innerJoin(file, eq(file.id, taskAttachment.fileId))
    .where(
      and(
        inArray(taskAttachment.taskId, taskIds),
        workspaceId ? eq(file.workspaceId, workspaceId) : undefined,
      ),
    )
    .orderBy(desc(taskAttachment.createdAt));
  for (const row of rows) {
    const list = map.get(row.taskId) ?? [];
    list.push({
      fileId: row.fileId,
      name: row.name,
      size: row.size,
      mimeType: row.mimeType,
      url: fileUrl(row.storedName),
      createdAt: row.createdAt.getTime(),
    });
    map.set(row.taskId, list);
  }
  return map;
}

export async function fetchMentions(
  taskIds: string[],
): Promise<Map<string, { id: string; name: string; email: string }[]>> {
  const map = new Map<string, { id: string; name: string; email: string }[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({
      taskId: taskMention.taskId,
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(taskMention)
    .innerJoin(user, eq(user.id, taskMention.userId))
    .where(inArray(taskMention.taskId, taskIds));
  for (const row of rows) {
    const list = map.get(row.taskId) ?? [];
    list.push({ id: row.id, name: row.name, email: row.email });
    map.set(row.taskId, list);
  }
  return map;
}

type TaskRow = typeof task.$inferSelect & {
  projectName: string | null;
  projectColor: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

const TASK_SELECT = {
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  projectId: task.projectId,
  projectName: project.name,
  projectColor: project.color,
  assigneeId: user.id,
  assigneeName: user.name,
  assigneeEmail: user.email,
  dueDate: task.dueDate,
  startDate: task.startDate,
  reminderAt: task.reminderAt,
  workspaceId: task.workspaceId,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
} as const;

async function hydrate(
  rows: (TaskRow & { workspaceId: string | null })[],
  workspaceId: string | null,
): Promise<Task[]> {
  const ids = rows.map((row) => row.id);
  const [attachmentMap, mentionMap] = await Promise.all([
    fetchAttachments(ids, workspaceId),
    fetchMentions(ids),
  ]);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    projectId: row.projectId,
    projectName: row.projectName,
    projectColor: row.projectColor,
    assigneeId: row.assigneeId,
    assignee:
      row.assigneeId && row.assigneeName
        ? avatarUserFor({
            id: row.assigneeId,
            name: row.assigneeName,
            email: row.assigneeEmail ?? "",
          })
        : null,
    dueDate: row.dueDate ? row.dueDate.getTime() : null,
    startDate: row.startDate ? row.startDate.getTime() : null,
    reminderAt: row.reminderAt ? row.reminderAt.getTime() : null,
    attachments: attachmentMap.get(row.id) ?? [],
    mentions: (mentionMap.get(row.id) ?? []).map((m) =>
      avatarUserFor({ id: m.id, name: m.name, email: m.email }),
    ),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  }));
}

export async function fetchTasks(workspaceId: string | null): Promise<Task[]> {
  const rows = await db
    .select(TASK_SELECT)
    .from(task)
    .leftJoin(project, eq(project.id, task.projectId))
    .leftJoin(user, eq(user.id, task.assigneeId))
    .where(workspaceId ? eq(task.workspaceId, workspaceId) : undefined)
    .orderBy(task.createdAt);
  return hydrate(rows, workspaceId);
}

export async function createTask(
  input: CreateTaskInput,
  selfId: string,
  workspaceId: string,
): Promise<Task> {
  const id = crypto.randomUUID();
  const assigneeId = input.assigneeId ?? selfId;
  const reminderAt = input.reminderAt ? new Date(input.reminderAt) : null;
  await db.insert(task).values({
    id,
    title: input.title.trim(),
    description: input.description ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? "none",
    projectId: input.projectId ?? null,
    assigneeId,
    workspaceId,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    reminderAt,
  });
  await syncMentions(id, input.mentions ?? [], selfId, true, workspaceId);
  if (input.attachFileIds && input.attachFileIds.length > 0) {
    await attachFiles(id, input.attachFileIds, workspaceId);
  }
  await notifyAssignee(id, assigneeId, selfId, true);
  const rows = await fetchTasks(workspaceId);
  const created = rows.find((row) => row.id === id);
  if (!created) throw new Error("Task insert failed");
  return created;
}

export async function syncMentions(
  taskId: string,
  userIds: string[],
  selfId: string,
  isCreate: boolean,
  workspaceId?: string | null,
): Promise<void> {
  const memberIds = workspaceId ? await workspaceMemberIds(workspaceId) : null;
  const valid = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        inArray(user.id, userIds),
        memberIds ? inArray(user.id, memberIds) : undefined,
      ),
    );
  const targetIds = valid.map((row) => row.id);
  const existingRows = await db
    .select({ userId: taskMention.userId })
    .from(taskMention)
    .where(eq(taskMention.taskId, taskId));
  const existingIds = new Set(existingRows.map((row) => row.userId));
  const targetSet = new Set(targetIds);

  const toAdd = targetIds.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !targetSet.has(id));
  if (toAdd.length > 0) {
    await db
      .insert(taskMention)
      .values(toAdd.map((userId) => ({ taskId, userId })));
  }
  if (toRemove.length > 0) {
    await db
      .delete(taskMention)
      .where(
        and(
          eq(taskMention.taskId, taskId),
          inArray(taskMention.userId, toRemove),
        ),
      );
  }
  if (!isCreate) {
    await notifyMentionedUsers(taskId, toAdd, selfId);
  }
}

export async function attachFiles(
  taskId: string,
  fileIds: string[],
  workspaceId?: string | null,
): Promise<void> {
  if (fileIds.length === 0) return;
  const valid = await db
    .select({ id: file.id })
    .from(file)
    .where(
      and(
        inArray(file.id, fileIds),
        workspaceId ? eq(file.workspaceId, workspaceId) : undefined,
      ),
    );
  const rows = valid.map((row) => ({ taskId, fileId: row.id }));
  if (rows.length > 0) {
    await db.insert(taskAttachment).values(rows).onConflictDoNothing();
  }
}

async function notifyMentionedUsers(
  taskId: string,
  userIds: string[],
  selfId: string,
): Promise<void> {
  if (userIds.length === 0) return;
  const targets = userIds.filter((id) => id !== selfId);
  if (targets.length === 0) return;
  const rows = await db
    .select({ id: task.id, title: task.title })
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1);
  if (rows.length === 0) return;
  await db.insert(notification).values(
    targets.map((userId) => ({
      id: crypto.randomUUID(),
      userId,
      type: "mention" as const,
      actorId: selfId,
      taskId,
    })),
  );
}

async function notifyAssignee(
  taskId: string,
  assigneeId: string,
  selfId: string,
  isCreate: boolean,
): Promise<void> {
  if (assigneeId === selfId || !isCreate) return;
  await db.insert(notification).values({
    id: crypto.randomUUID(),
    userId: assigneeId,
    type: "assignment",
    actorId: selfId,
    taskId,
  });
}

export async function fetchNotifications(
  userId: string,
  workspaceId: string | null,
): Promise<AppNotification[]> {
  await materializeDueReminders(userId, workspaceId);
  const rows = await db
    .select({
      id: notification.id,
      type: notification.type,
      actorId: notification.actorId,
      actorName: user.name,
      actorEmail: user.email,
      taskId: notification.taskId,
      taskTitle: task.title,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    })
    .from(notification)
    .innerJoin(user, eq(user.id, notification.actorId))
    .innerJoin(task, eq(task.id, notification.taskId))
    .where(
      and(
        eq(notification.userId, userId),
        workspaceId ? eq(task.workspaceId, workspaceId) : undefined,
      ),
    )
    .orderBy(desc(notification.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    actorId: row.actorId,
    actorName: row.actorName,
    actorColor: avatarUserFor({
      id: row.actorId,
      name: row.actorName,
      email: row.actorEmail,
    }).color,
    taskId: row.taskId,
    taskTitle: row.taskTitle,
    createdAt: row.createdAt.getTime(),
    readAt: row.readAt ? row.readAt.getTime() : null,
  }));
}

async function materializeDueReminders(
  userId: string,
  workspaceId: string | null,
): Promise<void> {
  const tasksWithDueReminders = await db
    .select({ id: task.id, reminderAt: task.reminderAt })
    .from(task)
    .where(
      and(
        eq(task.assigneeId, userId),
        workspaceId ? eq(task.workspaceId, workspaceId) : undefined,
        ne(task.status, "done"),
        isNotNull(task.reminderAt),
        lte(task.reminderAt, new Date()),
      ),
    );
  for (const taskRow of tasksWithDueReminders) {
    if (!taskRow.reminderAt) continue;
    await db
      .insert(notification)
      .values({
        id: `reminder-${taskRow.id}-${taskRow.reminderAt.getTime()}`,
        userId,
        type: "reminder",
        actorId: userId,
        taskId: taskRow.id,
      })
      .onConflictDoNothing();
  }
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
}
