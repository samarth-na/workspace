import { and, count, desc, eq, gt, inArray, ne } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  conversation,
  conversationMember,
  message,
  messageReaction,
} from "@/db/chat";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { avatarColorFor } from "@/lib/chat-avatars";
import type {
  AvatarUser,
  ChatMessage,
  ConversationSummary,
  MessageReaction,
} from "@/lib/chat-types";

export type SessionUser = { id: string; name: string; email: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

export function avatarUserFor(row: {
  id: string;
  name: string;
  email: string;
}): AvatarUser {
  return {
    id: row.id,
    name: row.name,
    initials: getInitials(row.name),
    color: avatarColorFor(row.email, row.id),
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function isMember(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(conversationMember)
    .where(
      and(
        eq(conversationMember.userId, userId),
        eq(conversationMember.conversationId, conversationId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function conversationBelongsToWorkspace(
  conversationId: string,
  workspaceId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: conversation.id })
    .from(conversation)
    .where(
      and(
        eq(conversation.id, conversationId),
        eq(conversation.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function listConversations(
  userId: string | null,
  workspaceId: string,
): Promise<(typeof conversation.$inferSelect)[]> {
  const wsFilter = eq(conversation.workspaceId, workspaceId);
  if (userId === null) {
    return db
      .select()
      .from(conversation)
      .where(wsFilter)
      .orderBy(desc(conversation.updatedAt));
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
    .where(wsFilter)
    .orderBy(desc(conversation.updatedAt));
  return rows.map((row) => row.conversation);
}

export async function fetchMembers(
  conversationId: string,
): Promise<AvatarUser[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(conversationMember)
    .innerJoin(user, eq(user.id, conversationMember.userId))
    .where(eq(conversationMember.conversationId, conversationId));
  return rows.map(avatarUserFor);
}

export async function fetchReactionRows(
  messageIds: string[],
): Promise<Map<string, { emoji: string; userId: string }[]>> {
  const map = new Map<string, { emoji: string; userId: string }[]>();
  if (messageIds.length === 0) return map;
  const rows = await db
    .select({
      messageId: messageReaction.messageId,
      emoji: messageReaction.emoji,
      userId: messageReaction.userId,
    })
    .from(messageReaction)
    .where(inArray(messageReaction.messageId, messageIds));
  for (const row of rows) {
    const list = map.get(row.messageId) ?? [];
    list.push({ emoji: row.emoji, userId: row.userId });
    map.set(row.messageId, list);
  }
  return map;
}

export function aggregateReactions(
  rows: { emoji: string; userId: string }[],
  selfId: string | null,
): MessageReaction[] {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.emoji) ?? [];
    list.push(row.userId);
    grouped.set(row.emoji, list);
  }
  return [...grouped.entries()].map(([emoji, userIds]) => ({
    emoji,
    userIds,
    reactedByMe: selfId !== null && userIds.includes(selfId),
  }));
}

export type MessageWithSender = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  senderName: string;
  senderEmail: string;
};

export function toChatMessage(
  row: MessageWithSender,
  reactions: MessageReaction[],
): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    sender: avatarUserFor({
      id: row.senderId,
      name: row.senderName,
      email: row.senderEmail,
    }),
    body: row.body,
    createdAt: row.createdAt.getTime(),
    reactions,
  };
}

async function countUnread(
  conversationId: string,
  userId: string,
  lastReadAt: Date | null,
): Promise<number> {
  const conditions = [
    eq(message.conversationId, conversationId),
    ne(message.senderId, userId),
  ];
  const readable = lastReadAt ?? new Date(0);
  conditions.push(gt(message.createdAt, readable));
  const rows = await db
    .select({ value: count() })
    .from(message)
    .where(and(...conditions));
  return rows[0]?.value ?? 0;
}

export async function buildConversationSummary(
  conv: typeof conversation.$inferSelect,
  selfId: string | null,
): Promise<ConversationSummary> {
  const members = await fetchMembers(conv.id);
  let name = conv.name ?? (conv.type === "group" ? "Group" : "Conversation");
  if (conv.type === "dm") {
    const peer = members.find((member) => member.id !== selfId);
    if (peer) name = peer.name;
  }
  const lastRows = await db
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
    .where(eq(message.conversationId, conv.id))
    .orderBy(desc(message.createdAt))
    .limit(1);
  let lastMessage: ChatMessage | null = null;
  if (lastRows[0]) {
    const reactionRows = await fetchReactionRows([lastRows[0].id]);
    lastMessage = toChatMessage(
      lastRows[0],
      aggregateReactions(reactionRows.get(lastRows[0].id) ?? [], selfId),
    );
  }
  const memberRow = selfId
    ? await db
        .select()
        .from(conversationMember)
        .where(
          and(
            eq(conversationMember.conversationId, conv.id),
            eq(conversationMember.userId, selfId),
          ),
        )
        .limit(1)
    : [];
  const unreadCount =
    selfId && memberRow[0]
      ? await countUnread(conv.id, selfId, memberRow[0].lastReadAt)
      : 0;
  return {
    id: conv.id,
    type: conv.type,
    name,
    topic: conv.topic ?? null,
    members,
    lastMessage,
    unreadCount,
    updatedAt: conv.updatedAt.getTime(),
  };
}
