import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";

export const recentItemType = [
  "conversation",
  "meeting",
  "folder",
  "call",
] as const;

export const recentItem = sqliteTable(
  "recent_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: recentItemType }).notNull(),
    itemId: text("item_id").notNull(),
    title: text("title").notNull(),
    href: text("href").notNull(),
    visitedAt: integer("visited_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("recent_user_visited_idx").on(table.userId, table.visitedAt),
    uniqueIndex("recent_user_item_idx").on(
      table.userId,
      table.type,
      table.itemId,
    ),
  ],
);

export const recentItemRelations = relations(recentItem, ({ one }) => ({
  user: one(user, {
    fields: [recentItem.userId],
    references: [user.id],
  }),
}));
