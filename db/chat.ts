import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";

export const conversation = sqliteTable("conversation", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["dm", "channel", "group"] }).notNull(),
  name: text("name"),
  topic: text("topic"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const conversationMember = sqliteTable(
  "conversation_member",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: integer("last_read_at", { mode: "timestamp_ms" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("conversation_member_userId_idx").on(table.userId),
  ],
);

export const message = sqliteTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("message_conversationId_createdAt_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const messageReaction = sqliteTable(
  "message_reaction",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId, table.emoji] }),
  ],
);

export const conversationRelations = relations(conversation, ({ many }) => ({
  members: many(conversationMember),
  messages: many(message),
}));

export const conversationMemberRelations = relations(
  conversationMember,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationMember.conversationId],
      references: [conversation.id],
    }),
    user: one(user, {
      fields: [conversationMember.userId],
      references: [user.id],
    }),
  }),
);

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  reactions: many(messageReaction),
}));

export const messageReactionRelations = relations(
  messageReaction,
  ({ one }) => ({
    message: one(message, {
      fields: [messageReaction.messageId],
      references: [message.id],
    }),
    user: one(user, {
      fields: [messageReaction.userId],
      references: [user.id],
    }),
  }),
);
