import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { project, task } from "@/db/tasks";
import { avatarUserFor } from "@/lib/chat-data";
import type { CreateTaskInput, Task } from "@/lib/task-types";

export type { SessionUser } from "@/lib/chat-data";

type TaskRow = typeof task.$inferSelect & {
  projectName: string | null;
  projectColor: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

export function toTask(row: TaskRow): Task {
  return {
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
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function fetchProjects() {
  const rows = await db.select().from(project).orderBy(project.createdAt);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function fetchWorkspaceUsers() {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .orderBy(user.name);
  return rows.map(avatarUserFor);
}

export async function fetchTasks() {
  const rows = await db
    .select({
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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })
    .from(task)
    .leftJoin(project, eq(project.id, task.projectId))
    .leftJoin(user, eq(user.id, task.assigneeId))
    .orderBy(task.createdAt);
  return rows.map(toTask);
}

export async function createTask(
  input: CreateTaskInput,
  selfId: string,
): Promise<Task> {
  const id = crypto.randomUUID();
  const assigneeId = input.assigneeId ?? selfId;
  await db.insert(task).values({
    id,
    title: input.title.trim(),
    description: input.description ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? "none",
    projectId: input.projectId ?? null,
    assigneeId,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    startDate: input.startDate ? new Date(input.startDate) : null,
  });
  const rows = await db
    .select({
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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })
    .from(task)
    .leftJoin(project, eq(project.id, task.projectId))
    .leftJoin(user, eq(user.id, task.assigneeId))
    .where(eq(task.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Task insert failed");
  return toTask(row);
}
