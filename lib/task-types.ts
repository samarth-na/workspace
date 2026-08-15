import type { taskPriority, taskStatus } from "@/db/tasks";
import type { AvatarUser } from "@/lib/chat-types";

export type { AvatarUser } from "@/lib/chat-types";

export type TaskStatus = (typeof taskStatus)[number];
export type TaskPriority = (typeof taskPriority)[number];

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  assigneeId: string | null;
  assignee: AvatarUser | null;
  dueDate: number | null;
  startDate: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Project = {
  id: string;
  name: string;
  color: string;
};

export type TasksResponse = {
  tasks: Task[];
  projects: Project[];
  users: AvatarUser[];
  isPreview: boolean;
};

export type CreateTaskInput = {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string | null;
  assigneeId?: string | null;
  dueDate?: number | null;
  startDate?: number | null;
  description?: string | null;
};

export type CreateTaskResponse = {
  task: Task;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string | null;
  assigneeId?: string | null;
  dueDate?: number | null;
  startDate?: number | null;
};

export type UpdateTaskResponse = {
  task: Task;
};
