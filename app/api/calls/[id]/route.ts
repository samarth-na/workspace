import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { call } from "@/db/calls";
import { addCallMember, getCall } from "@/lib/call-data";
import type { CallResponse } from "@/lib/call-types";
import { getSessionUser } from "@/lib/chat-data";
import { recordRecent } from "@/lib/recents-data";
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

async function callResponse(
  callId: string,
  self: { id: string; name: string } | null,
  workspaceId: string | null,
): Promise<CallResponse | null> {
  const summary = await getCall(callId, self?.id ?? null, workspaceId);
  if (!summary) return null;
  return {
    call: summary,
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
  const data = await callResponse(id, self, workspaceId);
  if (!data) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (self) {
    await recordRecent({
      userId: self.id,
      type: "call",
      itemId: id,
      title: `Call with ${
        data.call.members
          .filter((member) => member.id !== self.id)
          .map((member) => member.name)
          .join(", ") || "your team"
      }`,
      href: `/call/${id}`,
    });
  }
  return NextResponse.json<CallResponse>(data);
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
    body.action !== "end" &&
    body.action !== "heartbeat"
  ) {
    return NextResponse.json(
      { error: "action must be join, end or heartbeat" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(call)
    .where(
      and(
        eq(call.id, id),
        workspaceId ? eq(call.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  if (body.action === "heartbeat") {
    if (!self) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const summary = await getCall(id, self.id, workspaceId);
    if (!summary || !(summary.isMember || summary.isHost)) {
      return NextResponse.json(
        { error: "You are not part of this call" },
        { status: 403 },
      );
    }
    if (row.status !== "ended") {
      await db
        .update(call)
        .set({ lastHeartbeatAt: new Date() })
        .where(eq(call.id, id));
    }
  } else if (body.action === "join") {
    if (self) {
      await addCallMember(id, self.id);
    }
    const answered = self !== null && self.id !== row.hostId;
    if (row.status !== "ended") {
      await db
        .update(call)
        .set(
          answered
            ? {
                status: "live",
                startsAt: new Date(),
                lastHeartbeatAt: new Date(),
              }
            : { lastHeartbeatAt: new Date() },
        )
        .where(eq(call.id, id));
    }
  } else {
    if (!self) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHost = row.hostId === self.id;
    if (!(context?.isAdmin ?? false) && !isHost) {
      return NextResponse.json(
        { error: "Only an admin or the call host can end this call" },
        { status: 403 },
      );
    }
    if (row.status !== "ended") {
      await db
        .update(call)
        .set({ status: "ended", endsAt: new Date() })
        .where(eq(call.id, id));
    }
  }

  const data = await callResponse(id, self, workspaceId);
  if (!data) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  return NextResponse.json<CallResponse>(data);
}
