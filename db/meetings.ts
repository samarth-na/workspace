import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "@/db/schema";

export const meeting = sqliteTable("meeting", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["scheduled", "live", "ended"] })
    .default("scheduled")
    .notNull(),
  hostId: text("host_id").references(() => user.id, { onDelete: "set null" }),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const meetingMember = sqliteTable(
  "meeting_member",
  {
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meeting.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.meetingId, table.userId] }),
    index("meeting_member_userId_idx").on(table.userId),
  ],
);

export const meetingRelations = relations(meeting, ({ many, one }) => ({
  members: many(meetingMember),
  host: one(user, {
    fields: [meeting.hostId],
    references: [user.id],
  }),
}));

export const meetingMemberRelations = relations(meetingMember, ({ one }) => ({
  meeting: one(meeting, {
    fields: [meetingMember.meetingId],
    references: [meeting.id],
  }),
  user: one(user, {
    fields: [meetingMember.userId],
    references: [user.id],
  }),
}));
