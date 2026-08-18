import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";
import { listRecents } from "@/lib/recents-data";

export async function GET() {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ recents: [] });
  }
  return NextResponse.json({ recents: await listRecents(self.id) });
}
