import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";

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

export const project = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

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
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
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
  ],
);

export const projectRelations = relations(project, ({ many }) => ({
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one }) => ({
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
  }),
}));
