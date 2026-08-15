import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { message, messageReaction } from "@/db/chat";
import {
  aggregateReactions,
  fetchReactionRows,
  getSessionUser,
  isMember,
} from "@/lib/chat-data";
import type {
  ToggleReactionInput,
  ToggleReactionResponse,
} from "@/lib/chat-types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const messages = await db
    .select()
    .from(message)
    .where(eq(message.id, id))
    .limit(1);
  const target = messages[0];
  if (!target) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (!(await isMember(self.id, target.conversationId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let input: ToggleReactionInput;
  try {
    input = (await request.json()) as ToggleReactionInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const emoji = typeof input.emoji === "string" ? input.emoji.trim() : "";
  if (emoji.length === 0 || emoji.length > 16) {
    return NextResponse.json(
      { error: "emoji must be between 1 and 16 characters" },
      { status: 400 },
    );
  }
  const existing = await db
    .select()
    .from(messageReaction)
    .where(
      and(
        eq(messageReaction.messageId, id),
        eq(messageReaction.userId, self.id),
        eq(messageReaction.emoji, emoji),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .delete(messageReaction)
      .where(
        and(
          eq(messageReaction.messageId, id),
          eq(messageReaction.userId, self.id),
          eq(messageReaction.emoji, emoji),
        ),
      );
  } else {
    await db
      .insert(messageReaction)
      .values({ messageId: id, userId: self.id, emoji });
  }
  const reactionRows = await fetchReactionRows([id]);
  const reactions = aggregateReactions(reactionRows.get(id) ?? [], self.id);
  return NextResponse.json<ToggleReactionResponse>({
    messageId: id,
    reactions,
  });
}
