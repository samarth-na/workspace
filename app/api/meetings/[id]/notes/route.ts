import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { meeting } from "@/db/meetings";
import { getSessionUser } from "@/lib/chat-data";
import { addMeetingNote, listMeetingNotes } from "@/lib/meeting-data";
import type {
  MeetingNoteInput,
  MeetingNotesResponse,
} from "@/lib/meeting-types";
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

async function findWorkspaceMeeting(meetingId: string) {
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
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
  return rows[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await findWorkspaceMeeting(id);
  if (!row) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  const notes = await listMeetingNotes(id);
  return NextResponse.json<MeetingNotesResponse>({ notes });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const row = await findWorkspaceMeeting(id);
  if (!row) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  const body = (await request.json()) as MeetingNoteInput;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length === 0) {
    return NextResponse.json({ error: "Note is empty" }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "Note is too long" }, { status: 400 });
  }
  const note = await addMeetingNote(id, self.id, content);
  return NextResponse.json({ note }, { status: 201 });
}
