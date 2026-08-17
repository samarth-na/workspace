import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";
import { workspace } from "@/db/workspace";

export const callStatus = ["ringing", "live", "ended"] as const;

export const call = sqliteTable(
  "call",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id").references(() => user.id, { onDelete: "set null" }),
    workspaceId: text("workspace_id").references(() => workspace.id, {
      onDelete: "cascade",
    }),
    status: text("status", { enum: callStatus }).default("ringing").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    lastHeartbeatAt: integer("last_heartbeat_at", {
      mode: "timestamp_ms",
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("call_workspace_idx").on(table.workspaceId)],
);

export const callMember = sqliteTable(
  "call_member",
  {
    callId: text("call_id")
      .notNull()
      .references(() => call.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.callId, table.userId] }),
    index("call_member_user_idx").on(table.userId),
  ],
);

export const callRelations = relations(call, ({ many, one }) => ({
  members: many(callMember),
  host: one(user, {
    fields: [call.hostId],
    references: [user.id],
  }),
}));

export const callMemberRelations = relations(callMember, ({ one }) => ({
  call: one(call, {
    fields: [callMember.callId],
    references: [call.id],
  }),
  user: one(user, {
    fields: [callMember.userId],
    references: [user.id],
  }),
}));
