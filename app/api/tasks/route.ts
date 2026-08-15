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
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

export async function GET() {
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const [tasks, projects, users] = await Promise.all([
    fetchTasks(workspaceId),
    fetchProjects(workspaceId),
    fetchWorkspaceUsers(workspaceId),
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
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
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
  if (input.assigneeId) {
    const users = await fetchWorkspaceUsers(context.workspaceId);
    if (!users.some((u) => u.id === input.assigneeId)) {
      return NextResponse.json({ error: "Unknown assignee" }, { status: 400 });
    }
  }
  if (input.projectId) {
    const projects = await fetchProjects(context.workspaceId);
    if (!projects.some((p) => p.id === input.projectId)) {
      return NextResponse.json({ error: "Unknown project" }, { status: 400 });
    }
  }
  const task = await createTask(
    { ...input, title },
    self.id,
    context.workspaceId,
  );
  return NextResponse.json<CreateTaskResponse>({ task });
}
