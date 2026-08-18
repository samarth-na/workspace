import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { meeting, meetingMember, meetingNote } from "@/db/meetings";
import { user } from "@/db/schema";
import { avatarUserFor } from "@/lib/chat-data";
import type { AvatarUser } from "@/lib/chat-types";
import type { MeetingNote, MeetingSummary } from "@/lib/meeting-types";

async function fetchMeetingMembers(
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
  let host: AvatarUser | null = null;
  if (row.hostId) {
    const member = memberRows.find((entry) => entry.id === row.hostId);
    if (member) {
      host = avatarUserFor(member);
    } else {
      const hostRows = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, row.hostId))
        .limit(1);
      if (hostRows[0]) host = avatarUserFor(hostRows[0]);
    }
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    host,
    startsAt: row.startsAt.getTime(),
    endsAt: row.endsAt?.getTime() ?? null,
    members: memberRows.map((member) => avatarUserFor(member)),
    isHost: selfId !== null && row.hostId === selfId,
    isMember:
      selfId !== null && memberRows.some((member) => member.id === selfId),
  };
}

async function listMeetingRows(
  userId: string | null,
  workspaceId: string | null,
  isAdmin: boolean,
): Promise<(typeof meeting.$inferSelect)[]> {
  const wsFilter = workspaceId
    ? eq(meeting.workspaceId, workspaceId)
    : undefined;
  if (userId === null || isAdmin) {
    return db
      .select()
      .from(meeting)
      .where(wsFilter)
      .orderBy(desc(meeting.startsAt));
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
    .where(wsFilter)
    .orderBy(desc(meeting.startsAt));
  return rows.map((row) => row.meeting);
}

export async function listMeetings(
  userId: string | null,
  workspaceId: string | null,
  isAdmin = false,
): Promise<MeetingSummary[]> {
  const rows = await listMeetingRows(userId, workspaceId, isAdmin);
  return Promise.all(rows.map((row) => toMeetingSummary(row, userId)));
}

export async function getMeeting(
  meetingId: string,
  userId: string | null,
  workspaceId: string | null,
): Promise<MeetingSummary | null> {
  const rows = await db
    .select()
    .from(meeting)
    .where(
      and(
        eq(meeting.id, meetingId),
        workspaceId ? eq(meeting.workspaceId, workspaceId) : undefined,
      ),
    )
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

export async function listMeetingNotes(
  meetingId: string,
): Promise<MeetingNote[]> {
  const rows = await db
    .select({
      id: meetingNote.id,
      content: meetingNote.content,
      createdAt: meetingNote.createdAt,
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(meetingNote)
    .innerJoin(user, eq(user.id, meetingNote.userId))
    .where(eq(meetingNote.meetingId, meetingId))
    .orderBy(desc(meetingNote.createdAt));
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    author: avatarUserFor({ id: row.userId, name: row.name, email: row.email }),
    createdAt: row.createdAt.getTime(),
  }));
}

export async function addMeetingNote(
  meetingId: string,
  userId: string,
  content: string,
): Promise<MeetingNote> {
  const id = randomUUID();
  await db.insert(meetingNote).values({ id, meetingId, userId, content });
  const notes = await listMeetingNotes(meetingId);
  const note = notes.find((entry) => entry.id === id);
  if (!note) {
    throw new Error("Could not create note");
  }
  return note;
}
