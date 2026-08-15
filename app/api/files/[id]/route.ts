import { unlink } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";
import type { DeleteFileResponse } from "@/lib/file-types";
import { deleteFileRow, fetchFileRow } from "@/lib/files-data";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await fetchFileRow(id);
  if (!row) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  await deleteFileRow(id);
  await unlink(
    path.join(process.cwd(), "public", "uploads", row.storedName),
  ).catch(() => {});
  return NextResponse.json<DeleteFileResponse>({ ok: true });
}
