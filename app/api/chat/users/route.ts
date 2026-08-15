import { and, inArray, ne, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { avatarUserFor, getSessionUser } from "@/lib/chat-data";
import type { UsersResponse } from "@/lib/chat-types";
import {
  getSessionWorkspace,
  previewWorkspaceId,
  workspaceMemberIds,
} from "@/lib/workspace-data";

export async function GET(request: NextRequest) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const memberIds = await workspaceMemberIds(workspaceId ?? "");
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const conditions = [
    ne(user.id, self.id),
    inArray(user.id, memberIds.length > 0 ? memberIds : [""]),
  ];
  if (q) {
    const needle = `%${q}%`;
    conditions.push(
      sql`(lower(${user.name}) like ${needle} or lower(${user.email}) like ${needle})`,
    );
  }
  const rows = await db
    .select()
    .from(user)
    .where(and(...conditions))
    .limit(20);
  const users = rows.map(avatarUserFor);
  return NextResponse.json<UsersResponse>({ users });
}
