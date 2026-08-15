import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";

export const folder = sqliteTable(
  "folder",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    parentId: text("parent_id").references(
      (): AnySQLiteColumn => folder.id,
      { onDelete: "cascade" },
    ),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("folder_parent_idx").on(table.parentId)],
);

export const file = sqliteTable(
  "file",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    storedName: text("stored_name").notNull(),
    folderId: text("folder_id").references(() => folder.id, {
      onDelete: "cascade",
    }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("file_createdAt_idx").on(table.createdAt),
    index("file_folder_idx").on(table.folderId),
  ],
);

export const folderRelations = relations(folder, ({ one, many }) => ({
  parent: one(folder, {
    fields: [folder.parentId],
    references: [folder.id],
  }),
  children: many(folder),
  files: many(file),
  owner: one(user, {
    fields: [folder.ownerId],
    references: [user.id],
  }),
}));

export const fileRelations = relations(file, ({ one }) => ({
  folder: one(folder, {
    fields: [file.folderId],
    references: [folder.id],
  }),
  uploader: one(user, {
    fields: [file.uploaderId],
    references: [user.id],
  }),
}));
