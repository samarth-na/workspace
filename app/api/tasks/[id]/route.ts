import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { notification, task } from "@/db/tasks";
import { getSessionUser } from "@/lib/chat-data";
import type { UpdateTaskInput, UpdateTaskResponse } from "@/lib/task-types";
import { attachFiles, fetchTasks, syncMentions } from "@/lib/tasks-data";
import { getSessionWorkspace } from "@/lib/workspace-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await db
    .select()
    .from(task)
    .where(and(eq(task.id, id), eq(task.workspaceId, context.workspaceId)))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  let input: UpdateTaskInput;
  try {
    input = (await request.json()) as UpdateTaskInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const current = existing[0];
  const title =
    typeof input.title === "string" ? input.title.trim() : current.title;
  if (title.length === 0) {
    return NextResponse.json(
      { error: "title cannot be empty" },
      { status: 400 },
    );
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title is too long" }, { status: 400 });
  }
  const assigneeChanged =
    input.assigneeId !== undefined && input.assigneeId !== current.assigneeId;
  await db
    .update(task)
    .set({
      title,
      description:
        input.description !== undefined
          ? input.description
          : current.description,
      status: input.status ?? current.status,
      priority: input.priority ?? current.priority,
      projectId:
        input.projectId !== undefined ? input.projectId : current.projectId,
      assigneeId:
        input.assigneeId !== undefined ? input.assigneeId : current.assigneeId,
      dueDate:
        input.dueDate !== undefined
          ? input.dueDate !== null
            ? new Date(input.dueDate)
            : null
          : current.dueDate,
      startDate:
        input.startDate !== undefined
          ? input.startDate !== null
            ? new Date(input.startDate)
            : null
          : current.startDate,
      reminderAt:
        input.reminderAt !== undefined
          ? input.reminderAt !== null
            ? new Date(input.reminderAt)
            : null
          : current.reminderAt,
    })
    .where(and(eq(task.id, id), eq(task.workspaceId, context.workspaceId)));
  if (input.mentions !== undefined) {
    await syncMentions(id, input.mentions, self.id, false, context.workspaceId);
  }
  if (input.attachFileIds !== undefined && input.attachFileIds.length > 0) {
    await attachFiles(id, input.attachFileIds, context.workspaceId);
  }
  if (assigneeChanged && input.assigneeId) {
    await notifyAssignee(id, input.assigneeId, self.id);
  }
  const tasks = await fetchTasks(context.workspaceId);
  const updated = tasks.find((t) => t.id === id);
  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json<UpdateTaskResponse>({ task: updated });
}

async function notifyAssignee(
  taskId: string,
  assigneeId: string,
  selfId: string,
) {
  if (assigneeId === selfId) return;
  await db.insert(notification).values({
    id: crypto.randomUUID(),
    userId: assigneeId,
    type: "assignment",
    actorId: selfId,
    taskId,
  });
}
