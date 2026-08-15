import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { meeting, meetingMember } from "@/db/meetings";
import { user } from "@/db/schema";
import { getSessionUser } from "@/lib/chat-data";
import { listMeetings } from "@/lib/meeting-data";
import type {
  CreateMeetingInput,
  CreateMeetingResponse,
  MeetingsResponse,
} from "@/lib/meeting-types";
import {
  getSessionWorkspace,
  previewWorkspaceId,
  workspaceMemberIds,
} from "@/lib/workspace-data";

export async function GET() {
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const meetings = await listMeetings(
    self?.id ?? null,
    workspaceId,
    context?.isAdmin ?? false,
  );
  return NextResponse.json<MeetingsResponse>({
    meetings,
    isPreview: self === null,
    isAdmin: context?.isAdmin ?? false,
  });
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const body = (await request.json()) as CreateMeetingInput;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (title.length > 120) {
    return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim().slice(0, 500)
      : null;

  let startsAt: Date;
  if (typeof body.startsAt === "string" && body.startsAt.length > 0) {
    const parsed = new Date(body.startsAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 },
      );
    }
    startsAt = parsed;
  } else {
    startsAt = new Date();
  }

  const memberIds = Array.isArray(body.memberIds)
    ? [...new Set(body.memberIds)].filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];
  if (memberIds.length > 0) {
    const workspaceMembers = await workspaceMemberIds(context.workspaceId);
    const found = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, memberIds));
    const validIds = new Set(
      found
        .filter((row) => workspaceMembers.includes(row.id))
        .map((row) => row.id),
    );
    for (const id of memberIds) {
      if (!validIds.has(id)) {
        return NextResponse.json({ error: "Unknown member" }, { status: 400 });
      }
    }
  }

  const meetingId = randomUUID();
  await db.insert(meeting).values({
    id: meetingId,
    title,
    description,
    hostId: self.id,
    workspaceId: context.workspaceId,
    startsAt,
    status: "scheduled",
  });
  await db
    .insert(meetingMember)
    .values([
      { meetingId, userId: self.id },
      ...memberIds.map((userId) => ({ meetingId, userId })),
    ]);
  return NextResponse.json<CreateMeetingResponse>(
    { meetingId },
    { status: 201 },
  );
}
