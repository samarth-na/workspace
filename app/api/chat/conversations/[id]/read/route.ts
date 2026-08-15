import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversation, conversationMember } from "@/db/chat";
import {
  conversationBelongsToWorkspace,
  getSessionUser,
  isMember,
} from "@/lib/chat-data";
import { getSessionWorkspace } from "@/lib/workspace-data";

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
  const context = await getSessionWorkspace();
  if (
    !context ||
    !(await conversationBelongsToWorkspace(id, context.workspaceId))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
