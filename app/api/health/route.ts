import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.run(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return NextResponse.json(
      { status: "degraded", database: "error" },
      { status: 503 },
    );
  }
}
