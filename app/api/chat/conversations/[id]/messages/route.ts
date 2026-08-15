import { and, desc, eq, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversation, message } from "@/db/chat";
import { user } from "@/db/schema";
import {
  aggregateReactions,
  fetchReactionRows,
  getSessionUser,
  isMember,
  toChatMessage,
} from "@/lib/chat-data";
import type { MessagesResponse } from "@/lib/chat-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  const conversations = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);
  if (conversations.length === 0) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }
  if (self && !(await isMember(self.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const beforeRaw = searchParams.get("before");
  const limitRaw = searchParams.get("limit");
  const beforeMs = beforeRaw === null ? NaN : Number(beforeRaw);
  let limit = 50;
  if (limitRaw !== null) {
    const parsed = Number.parseInt(limitRaw, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100);
    }
  }

  const conditions = [eq(message.conversationId, id)];
  if (Number.isFinite(beforeMs)) {
    conditions.push(lt(message.createdAt, new Date(beforeMs)));
  }

  const fetched = await db
    .select({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
      senderName: user.name,
      senderEmail: user.email,
    })
    .from(message)
    .innerJoin(user, eq(user.id, message.senderId))
    .where(and(...conditions))
    .orderBy(desc(message.createdAt))
    .limit(limit + 1);

  const hasMore = fetched.length > limit;
  const page = hasMore ? fetched.slice(0, limit) : fetched;
  const reactionRows = await fetchReactionRows(page.map((row) => row.id));
  const messages = page
    .map((row) =>
      toChatMessage(
        row,
        aggregateReactions(reactionRows.get(row.id) ?? [], self?.id ?? null),
      ),
    )
    .reverse();
  const oldest = page[page.length - 1];
  const nextBefore = oldest ? oldest.createdAt.getTime() : null;

  return NextResponse.json<MessagesResponse>({
    messages,
    hasMore,
    nextBefore: hasMore ? nextBefore : null,
  });
}
