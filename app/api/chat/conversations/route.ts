import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversation, conversationMember } from "@/db/chat";
import { user } from "@/db/schema";
import {
  buildConversationSummary,
  getSessionUser,
  type SessionUser,
} from "@/lib/chat-data";
import type {
  ConversationsResponse,
  CreateDmInput,
  CreateDmResponse,
  CreateGroupInput,
  CreateGroupResponse,
} from "@/lib/chat-types";

export async function GET() {
  const self = await getSessionUser();
  const conversations = await Promise.all(
    (await listConversations(self?.id ?? null)).map((conv) =>
      buildConversationSummary(conv, self?.id ?? null),
    ),
  );
  return NextResponse.json<ConversationsResponse>({
    conversations,
    isPreview: self === null,
  });
}

async function listConversations(
  userId: string | null,
): Promise<(typeof conversation.$inferSelect)[]> {
  if (userId === null) {
    return db.select().from(conversation).orderBy(desc(conversation.updatedAt));
  }
  const rows = await db
    .select()
    .from(conversation)
    .innerJoin(
      conversationMember,
      and(
        eq(conversationMember.conversationId, conversation.id),
        eq(conversationMember.userId, userId),
      ),
    )
    .orderBy(desc(conversation.updatedAt));
  return rows.map((row) => row.conversation);
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as CreateDmInput & CreateGroupInput;
  if (typeof body.userId === "string") {
    return createDmConversation(self, body.userId);
  }
  return createGroupConversation(self, body);
}

async function createDmConversation(
  self: SessionUser,
  peerId: string,
): Promise<NextResponse> {
  if (peerId.length === 0) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (peerId === self.id) {
    return NextResponse.json(
      { error: "Cannot open a conversation with yourself" },
      { status: 400 },
    );
  }
  const targets = await db
    .select()
    .from(user)
    .where(eq(user.id, peerId))
    .limit(1);
  if (targets.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const selfMember = alias(conversationMember, "self_member");
  const peerMember = alias(conversationMember, "peer_member");
  const existing = await db
    .select({ id: conversation.id })
    .from(conversation)
    .innerJoin(
      selfMember,
      and(
        eq(selfMember.conversationId, conversation.id),
        eq(selfMember.userId, self.id),
      ),
    )
    .innerJoin(
      peerMember,
      and(
        eq(peerMember.conversationId, conversation.id),
        eq(peerMember.userId, peerId),
      ),
    )
    .where(eq(conversation.type, "dm"))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json<CreateDmResponse>({
      conversationId: existing[0].id,
    });
  }
  const conversationId = randomUUID();
  await db
    .insert(conversation)
    .values({ id: conversationId, type: "dm", name: null });
  await db.insert(conversationMember).values([
    { conversationId, userId: self.id },
    { conversationId, userId: peerId },
  ]);
  return NextResponse.json<CreateDmResponse>({ conversationId });
}

async function createGroupConversation(
  self: SessionUser,
  body: CreateGroupInput,
): Promise<NextResponse> {
  const ids = [...new Set(body.userIds ?? [])].filter((id) => id !== self.id);
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Select at least one person" },
      { status: 400 },
    );
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: "Too many members" }, { status: 400 });
  }
  const targets = await db.select().from(user).where(inArray(user.id, ids));
  if (targets.length !== ids.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const requestedName = typeof body.name === "string" ? body.name.trim() : "";
  const name = (
    requestedName ||
    targets.map((target) => target.name.split(" ")[0]).join(", ")
  ).slice(0, 60);
  const topic =
    typeof body.topic === "string" ? body.topic.trim().slice(0, 200) : "";
  const conversationId = randomUUID();
  await db.insert(conversation).values({
    id: conversationId,
    type: "group",
    name: name || null,
    topic: topic || null,
  });
  await db
    .insert(conversationMember)
    .values([
      { conversationId, userId: self.id },
      ...ids.map((userId) => ({ conversationId, userId })),
    ]);
  return NextResponse.json<CreateGroupResponse>({ conversationId });
}
