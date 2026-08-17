import { randomUUID } from "node:crypto";

import { and, desc, eq, gt, lt, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { call, callMember } from "@/db/calls";
import { user } from "@/db/schema";
import type { CallSummary } from "@/lib/call-types";
import { avatarUserFor } from "@/lib/chat-data";
import type { AvatarUser } from "@/lib/chat-types";

const HEARTBEAT_STALE_MS = 90_000;
const RECENT_WINDOW_MS = 86_400_000;

export async function fetchCallMembers(
  callId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(callMember)
    .innerJoin(user, eq(user.id, callMember.userId))
    .where(eq(callMember.callId, callId));
  return rows;
}

export async function toCallSummary(
  row: typeof call.$inferSelect,
  selfId: string | null,
): Promise<CallSummary> {
  const memberRows = await fetchCallMembers(row.id);
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
    status: row.status,
    host,
    startedAt: row.startsAt.getTime(),
    endsAt: row.endsAt?.getTime() ?? null,
    members: memberRows.map((member) => avatarUserFor(member)),
    isHost: selfId !== null && row.hostId === selfId,
    isMember:
      selfId !== null && memberRows.some((member) => member.id === selfId),
  };
}

export async function endStaleCalls(): Promise<void> {
  const now = new Date();
  await db
    .update(call)
    .set({ status: "ended", endsAt: now })
    .where(
      and(
        ne(call.status, "ended"),
        lt(call.lastHeartbeatAt, new Date(now.getTime() - HEARTBEAT_STALE_MS)),
      ),
    );
}

export async function getCall(
  callId: string,
  userId: string | null,
  workspaceId: string | null,
): Promise<CallSummary | null> {
  const rows = await db
    .select()
    .from(call)
    .where(
      and(
        eq(call.id, callId),
        workspaceId ? eq(call.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return toCallSummary(row, userId);
}

export async function listCalls(
  userId: string | null,
  workspaceId: string | null,
  isAdmin = false,
): Promise<CallSummary[]> {
  await endStaleCalls();
  const wsFilter = workspaceId ? eq(call.workspaceId, workspaceId) : undefined;
  const recentCutoff = new Date(Date.now() - RECENT_WINDOW_MS);
  const statusFilter = or(
    ne(call.status, "ended"),
    gt(call.endsAt, recentCutoff),
  );
  if (userId === null || isAdmin) {
    const rows = await db
      .select()
      .from(call)
      .where(and(wsFilter, statusFilter))
      .orderBy(desc(call.status), desc(call.endsAt), desc(call.createdAt));
    return Promise.all(rows.map((row) => toCallSummary(row, userId)));
  }
  const rows = await db
    .select()
    .from(call)
    .innerJoin(
      callMember,
      and(eq(callMember.callId, call.id), eq(callMember.userId, userId)),
    )
    .where(and(wsFilter, statusFilter))
    .orderBy(desc(call.status), desc(call.endsAt), desc(call.createdAt));
  const callRows = rows.map((row) => row.call);
  return Promise.all(callRows.map((row) => toCallSummary(row, userId)));
}

export async function createCall(
  hostId: string,
  workspaceId: string,
  memberIds: string[],
): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  await db.insert(call).values({
    id,
    hostId,
    workspaceId,
    status: "ringing",
    startsAt: now,
    lastHeartbeatAt: now,
  });
  await db
    .insert(callMember)
    .values([
      { callId: id, userId: hostId },
      ...memberIds.map((userId) => ({ callId: id, userId })),
    ])
    .onConflictDoNothing();
  return id;
}

export async function addCallMember(
  callId: string,
  userId: string,
): Promise<void> {
  await db.insert(callMember).values({ callId, userId }).onConflictDoNothing();
}
