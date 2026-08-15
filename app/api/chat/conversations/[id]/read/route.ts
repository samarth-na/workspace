import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversation, conversationMember } from "@/db/chat";
import { getSessionUser, isMember } from "@/lib/chat-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  if (!(await isMember(self.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(conversationMember)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationMember.conversationId, id),
        eq(conversationMember.userId, self.id),
      ),
    );
  return new NextResponse(null, { status: 204 });
}
