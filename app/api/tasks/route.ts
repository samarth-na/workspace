import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";
import type {
  CreateTaskInput,
  CreateTaskResponse,
  TasksResponse,
} from "@/lib/task-types";
import {
  createTask,
  fetchProjects,
  fetchTasks,
  fetchWorkspaceUsers,
} from "@/lib/tasks-data";

export async function GET() {
  const self = await getSessionUser();
  const [tasks, projects, users] = await Promise.all([
    fetchTasks(),
    fetchProjects(),
    fetchWorkspaceUsers(),
  ]);
  return NextResponse.json<TasksResponse>({
    tasks,
    projects,
    users,
    isPreview: !self,
  });
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let input: CreateTaskInput;
  try {
    input = (await request.json()) as CreateTaskInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title is too long" }, { status: 400 });
  }
  const task = await createTask({ ...input, title }, self.id);
  return NextResponse.json<CreateTaskResponse>({ task });
}
