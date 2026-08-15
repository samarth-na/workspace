import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { meeting, meetingMember } from "@/db/meetings";
import { user } from "@/db/schema";
import { getSessionUser } from "@/lib/chat-data";
import { getMeeting } from "@/lib/meeting-data";
import type { MeetingAssigneesInput, MeetingResponse } from "@/lib/meeting-types";
import { getSessionWorkspace, workspaceMemberIds } from "@/lib/workspace-data";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  if (!context.isAdmin) {
    return NextResponse.json(
      { error: "Only workspace admins can assign meetings" },
      { status: 403 },
    );
  }
  const rows = await db
    .select()
    .from(meeting)
    .where(and(eq(meeting.id, id), eq(meeting.workspaceId, context.workspaceId)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const body = (await request.json()) as MeetingAssigneesInput;
  const memberIds = Array.isArray(body.memberIds)
    ? [...new Set(body.memberIds)].filter(
        (entry): entry is string => typeof entry === "string" && entry.length > 0,
      )
    : [];
  const workspaceMembers = await workspaceMemberIds(context.workspaceId);
  const found = memberIds.length
    ? await db
        .select({ id: user.id })
        .from(user)
        .where(inArray(user.id, memberIds))
    : [];
  const validIds = new Set(
    found
      .filter((entry) => workspaceMembers.includes(entry.id))
      .map((entry) => entry.id),
  );
  for (const memberId of memberIds) {
    if (!validIds.has(memberId)) {
      return NextResponse.json({ error: "Unknown member" }, { status: 400 });
    }
  }

  await db
    .delete(meetingMember)
    .where(eq(meetingMember.meetingId, id));
  if (memberIds.length > 0) {
    await db
      .insert(meetingMember)
      .values(memberIds.map((userId) => ({ meetingId: id, userId })));
  }
  if (!memberIds.includes(self.id)) {
    await db
      .insert(meetingMember)
      .values({ meetingId: id, userId: self.id })
      .onConflictDoNothing();
  }

  const summary = await getMeeting(id, self.id, context.workspaceId);
  if (!summary) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  return NextResponse.json<MeetingResponse>({
    meeting: summary,
    me: { name: self.name, isSignedIn: true },
  });
}
