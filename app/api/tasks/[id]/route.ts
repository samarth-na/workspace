import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { task } from "@/db/tasks";
import { getSessionUser } from "@/lib/chat-data";
import type { UpdateTaskInput, UpdateTaskResponse } from "@/lib/task-types";
import { fetchTasks } from "@/lib/tasks-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await db.select().from(task).where(eq(task.id, id)).limit(1);
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
    })
    .where(eq(task.id, id));
  const tasks = await fetchTasks();
  const updated = tasks.find((t) => t.id === id);
  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json<UpdateTaskResponse>({ task: updated });
}
