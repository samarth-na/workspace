import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { file } from "@/db/files";
import { user } from "@/db/schema";
import { getSessionUser } from "@/lib/chat-data";
import type { DeleteFileResponse, UpdateFileResponse } from "@/lib/file-types";
import {
  deleteFileRow,
  fetchFileRow,
  fetchFolderRow,
  moveFile,
  renameFile,
  toFileItem,
} from "@/lib/files-data";
import { utapi } from "@/lib/uploadthing";
import { getSessionWorkspace } from "@/lib/workspace-data";

const MAX_NAME_LENGTH = 180;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const { id } = await params;
  const row = await fetchFileRow(id, context.workspaceId);
  if (!row) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  let input: { name?: unknown; folderId?: unknown };
  try {
    input = (await request.json()) as { name?: unknown; folderId?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "file name is invalid" },
        { status: 400 },
      );
    }
    await renameFile(id, name);
  }
  if (input.folderId !== undefined) {
    const folderId =
      input.folderId === null || input.folderId === ""
        ? null
        : typeof input.folderId === "string"
          ? input.folderId
          : null;
    if (folderId && !(await fetchFolderRow(folderId, context.workspaceId))) {
      return NextResponse.json({ error: "Folder not found" }, { status: 400 });
    }
    await moveFile(id, folderId);
  }
  const updated = await db
    .select({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      storedName: file.storedName,
      uploaderName: user.name,
      createdAt: file.createdAt,
    })
    .from(file)
    .innerJoin(user, eq(user.id, file.uploaderId))
    .where(eq(file.id, id))
    .limit(1);
  const updatedRow = updated[0];
  if (!updatedRow) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return NextResponse.json<UpdateFileResponse>({
    file: toFileItem(updatedRow),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const { id } = await params;
  const row = await fetchFileRow(id, context.workspaceId);
  if (!row) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const storedName = await deleteFileRow(id);
  if (!storedName) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  await utapi.deleteFiles(storedName).catch(() => {});
  return NextResponse.json<DeleteFileResponse>({ ok: true });
}
