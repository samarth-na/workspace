import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { meeting } from "@/db/meetings";
import { getSessionUser } from "@/lib/chat-data";
import { addMeetingMember, getMeeting } from "@/lib/meeting-data";
import type { MeetingResponse } from "@/lib/meeting-types";
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

async function meetingResponse(
  meetingId: string,
  self: { id: string; name: string } | null,
  workspaceId: string | null,
): Promise<MeetingResponse | null> {
  const summary = await getMeeting(meetingId, self?.id ?? null, workspaceId);
  if (!summary) return null;
  return {
    meeting: summary,
    me: self ? { name: self.name, isSignedIn: true } : null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const data = await meetingResponse(id, self, workspaceId);
  if (!data) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  return NextResponse.json<MeetingResponse>(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const body = (await request.json()) as { action?: string };
  if (
    body.action !== "join" &&
    body.action !== "start" &&
    body.action !== "end"
  ) {
    return NextResponse.json(
      { error: "action must be join, start or end" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(meeting)
    .where(
      and(
        eq(meeting.id, id),
        workspaceId ? eq(meeting.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (body.action === "join") {
    if (self) {
      await addMeetingMember(id, self.id);
    }
    if (row.status === "scheduled") {
      const now = new Date();
      const startsAt =
        row.startsAt.getTime() > now.getTime() ? row.startsAt : now;
      await db
        .update(meeting)
        .set({ status: "live", startsAt })
        .where(eq(meeting.id, id));
    }
  } else {
    if (!self) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHost = row.hostId === self.id;
    if (!(context?.isAdmin ?? false) && !isHost) {
      return NextResponse.json(
        { error: "Only an admin or the host can manage this meeting" },
        { status: 403 },
      );
    }
    if (body.action === "start") {
      if (row.status === "ended") {
        return NextResponse.json(
          { error: "This meeting has ended" },
          { status: 400 },
        );
      }
      const now = new Date();
      const startsAt =
        row.startsAt.getTime() > now.getTime() ? row.startsAt : now;
      await db
        .update(meeting)
        .set({ status: "live", startsAt, endsAt: null })
        .where(eq(meeting.id, id));
    } else {
      await db
        .update(meeting)
        .set({ status: "ended", endsAt: new Date() })
        .where(eq(meeting.id, id));
    }
  }

  const data = await meetingResponse(id, self, workspaceId);
  if (!data) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  return NextResponse.json<MeetingResponse>(data);
}
