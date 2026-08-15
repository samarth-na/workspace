import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { meeting, meetingMember } from "@/db/meetings";
import { user } from "@/db/schema";
import { avatarUserFor } from "@/lib/chat-data";
import type { MeetingSummary } from "@/lib/meeting-types";

export type SessionUser = { id: string; name: string; email: string };

export async function fetchMeetingMembers(
  meetingId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(meetingMember)
    .innerJoin(user, eq(user.id, meetingMember.userId))
    .where(eq(meetingMember.meetingId, meetingId));
  return rows;
}

export async function toMeetingSummary(
  row: typeof meeting.$inferSelect,
  selfId: string | null,
): Promise<MeetingSummary> {
  const memberRows = await fetchMeetingMembers(row.id);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    hostId: row.hostId,
    startsAt: row.startsAt.getTime(),
    endsAt: row.endsAt?.getTime() ?? null,
    members: memberRows.map((member) => avatarUserFor(member)),
    isHost: selfId !== null && row.hostId === selfId,
    isMember:
      selfId !== null && memberRows.some((member) => member.id === selfId),
  };
}

export async function listMeetingRows(
  userId: string | null,
): Promise<(typeof meeting.$inferSelect)[]> {
  if (userId === null) {
    return db.select().from(meeting).orderBy(desc(meeting.startsAt));
  }
  const rows = await db
    .select()
    .from(meeting)
    .innerJoin(
      meetingMember,
      and(
        eq(meetingMember.meetingId, meeting.id),
        eq(meetingMember.userId, userId),
      ),
    )
    .orderBy(desc(meeting.startsAt));
  return rows.map((row) => row.meeting);
}

export async function listMeetings(
  userId: string | null,
): Promise<MeetingSummary[]> {
  const rows = await listMeetingRows(userId);
  return Promise.all(rows.map((row) => toMeetingSummary(row, userId)));
}

export async function getMeeting(
  meetingId: string,
  userId: string | null,
): Promise<MeetingSummary | null> {
  const rows = await db
    .select()
    .from(meeting)
    .where(eq(meeting.id, meetingId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return toMeetingSummary(row, userId);
}

export async function addMeetingMember(
  meetingId: string,
  userId: string,
): Promise<void> {
  await db
    .insert(meetingMember)
    .values({ meetingId, userId })
    .onConflictDoNothing();
}
