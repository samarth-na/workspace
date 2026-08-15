import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversation, conversationMember, message } from "@/db/chat";
import { getSessionUser, isMember, toChatMessage } from "@/lib/chat-data";
import {
  MAX_MESSAGE_LENGTH,
  type SendMessageInput,
  type SendMessageResponse,
} from "@/lib/chat-types";

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let input: SendMessageInput;
  try {
    input = (await request.json()) as SendMessageInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (
    typeof input.conversationId !== "string" ||
    input.conversationId.length === 0
  ) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }
  const conversations = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, input.conversationId))
    .limit(1);
  if (conversations.length === 0) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }
  if (!(await isMember(self.id, input.conversationId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length === 0) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 },
    );
  }
  if (body.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const messageId = randomUUID();
  const now = new Date();
  await db.insert(message).values({
    id: messageId,
    conversationId: input.conversationId,
    senderId: self.id,
    body,
  });
  await db
    .update(conversation)
    .set({ updatedAt: now })
    .where(eq(conversation.id, input.conversationId));
  await db
    .update(conversationMember)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationMember.conversationId, input.conversationId),
        eq(conversationMember.userId, self.id),
      ),
    );

  const created = toChatMessage(
    {
      id: messageId,
      conversationId: input.conversationId,
      senderId: self.id,
      body,
      createdAt: now,
      senderName: self.name,
      senderEmail: self.email,
    },
    [],
  );
  return NextResponse.json<SendMessageResponse>({ message: created });
}
