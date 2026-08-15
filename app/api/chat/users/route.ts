import { and, ne, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { avatarUserFor, getSessionUser } from "@/lib/chat-data";
import type { UsersResponse } from "@/lib/chat-types";

export async function GET(request: NextRequest) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const conditions = [ne(user.id, self.id)];
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
