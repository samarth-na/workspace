import { randomUUID } from "node:crypto";

import { and, desc, eq, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { recentItem, type recentItemType } from "@/db/recents";

const MAX_RECENTS = 8;

export type RecentItemType = (typeof recentItemType)[number];

export type RecentItemDto = {
  id: string;
  type: RecentItemType;
  itemId: string;
  title: string;
  href: string;
  visitedAt: number;
};

export async function recordRecent(input: {
  userId: string;
  type: RecentItemType;
  itemId: string;
  title: string;
  href: string;
}): Promise<void> {
  const visitedAt = new Date();
  await db
    .insert(recentItem)
    .values({ id: randomUUID(), ...input, visitedAt })
    .onConflictDoUpdate({
      target: [recentItem.userId, recentItem.type, recentItem.itemId],
      set: { title: input.title, href: input.href, visitedAt },
    });
  const kept = await db
    .select({ id: recentItem.id })
    .from(recentItem)
    .where(eq(recentItem.userId, input.userId))
    .orderBy(desc(recentItem.visitedAt))
    .limit(MAX_RECENTS);
  const keptIds = kept.map((row) => row.id);
  if (keptIds.length === 0) {
    await db.delete(recentItem).where(eq(recentItem.userId, input.userId));
  } else {
    await db
      .delete(recentItem)
      .where(
        and(
          eq(recentItem.userId, input.userId),
          notInArray(recentItem.id, keptIds),
        ),
      );
  }
}

export async function listRecents(
  userId: string,
  limit = MAX_RECENTS,
): Promise<RecentItemDto[]> {
  const rows = await db
    .select()
    .from(recentItem)
    .where(eq(recentItem.userId, userId))
    .orderBy(desc(recentItem.visitedAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    itemId: row.itemId,
    title: row.title,
    href: row.href,
    visitedAt: row.visitedAt.getTime(),
  }));
}
