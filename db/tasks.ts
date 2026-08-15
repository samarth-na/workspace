import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { file } from "@/db/files";
import { user } from "@/db/schema";
import { workspace } from "@/db/workspace";

export const taskStatus = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
] as const;

export const taskPriority = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const;

export const notificationType = ["mention", "assignment", "reminder"] as const;

export const project = sqliteTable(
  "project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    workspaceId: text("workspace_id").references(() => workspace.id, {
      onDelete: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("project_workspace_idx").on(table.workspaceId)],
);

export const task = sqliteTable(
  "task",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: taskStatus }).notNull().default("todo"),
    priority: text("priority", { enum: taskPriority })
      .notNull()
      .default("none"),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    workspaceId: text("workspace_id").references(() => workspace.id, {
      onDelete: "cascade",
    }),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
    reminderAt: integer("reminder_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("task_status_idx").on(table.status),
    index("task_assignee_idx").on(table.assigneeId),
    index("task_dueDate_idx").on(table.dueDate),
    index("task_reminderAt_idx").on(table.reminderAt),
    index("task_workspace_idx").on(table.workspaceId),
  ],
);

export const taskAttachment = sqliteTable(
  "task_attachment",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.fileId] }),
    index("task_attachment_fileId_idx").on(table.fileId),
  ],
);

export const taskMention = sqliteTable(
  "task_mention",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    index("task_mention_userId_idx").on(table.userId),
  ],
);

export const notification = sqliteTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: notificationType }).notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_userRead_idx").on(table.userId, table.readAt),
  ],
);

export const projectRelations = relations(project, ({ many }) => ({
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
  }),
  attachments: many(taskAttachment),
  mentions: many(taskMention),
}));

export const taskAttachmentRelations = relations(taskAttachment, ({ one }) => ({
  task: one(task, {
    fields: [taskAttachment.taskId],
    references: [task.id],
  }),
  file: one(file, {
    fields: [taskAttachment.fileId],
    references: [file.id],
  }),
}));

export const taskMentionRelations = relations(taskMention, ({ one }) => ({
  task: one(task, {
    fields: [taskMention.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskMention.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  actor: one(user, {
    fields: [notification.actorId],
    references: [user.id],
  }),
  task: one(task, {
    fields: [notification.taskId],
    references: [task.id],
  }),
}));
