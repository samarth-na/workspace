import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { file } from "@/db/files";
import { getSessionUser } from "@/lib/chat-data";
import type {
  FolderContentsResponse,
  UploadFileResponse,
} from "@/lib/file-types";
import {
  fetchAllFiles,
  fetchFiles,
  fetchFolderPath,
  fetchFolderRow,
  fetchFolders,
  fetchWorkspaceStorageUsed,
  toFileItem,
  WORKSPACE_STORAGE_LIMIT,
} from "@/lib/files-data";
import { isPublicPreviewEnabled } from "@/lib/public-preview";
import { recordRecent } from "@/lib/recents-data";
import { utapi } from "@/lib/uploadthing";
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

const MAX_FILE_SIZE = 32 * 1024 * 1024;
const MAX_NAME_LENGTH = 180;
const KEY_PATTERN = /^[a-z0-9_-]{8,128}$/i;

export async function GET(request: Request) {
  const self = await getSessionUser();
  if (!self && !isPublicPreviewEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const url = new URL(request.url);
  const folderParam = url.searchParams.get("folder");
  const all = folderParam === "all";
  const folderId = all ? null : folderParam;
  const [files, folders, folderPath, storageUsed] = await Promise.all([
    all ? fetchAllFiles(workspaceId) : fetchFiles(folderId, workspaceId),
    all ? [] : fetchFolders(folderId, workspaceId),
    all ? [] : fetchFolderPath(folderId, workspaceId),
    workspaceId ? fetchWorkspaceStorageUsed(workspaceId) : Promise.resolve(0),
  ]);
  if (self && folderId) {
    const row = await fetchFolderRow(folderId, workspaceId);
    if (row) {
      await recordRecent({
        userId: self.id,
        type: "folder",
        itemId: row.id,
        title: row.name,
        href: `/files?folder=${row.id}`,
      });
    }
  }
  return NextResponse.json<FolderContentsResponse>({
    files,
    folders,
    path: folderPath,
    isPreview: !self,
    storage: { used: storageUsed, limit: WORKSPACE_STORAGE_LIMIT },
  });
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  let input: {
    key?: unknown;
    name?: unknown;
    size?: unknown;
    mimeType?: unknown;
    folderId?: unknown;
  };
  try {
    input = (await request.json()) as typeof input;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const key = typeof input.key === "string" ? input.key.trim() : "";
  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: "file key is invalid" }, { status: 400 });
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "file name is invalid" },
      { status: 400 },
    );
  }
  const size =
    typeof input.size === "number" && Number.isInteger(input.size)
      ? input.size
      : 0;
  if (size === 0) {
    return NextResponse.json({ error: "file is empty" }, { status: 400 });
  }
  if (size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "file exceeds the 32 MB limit" },
      { status: 400 },
    );
  }
  const mimeType =
    typeof input.mimeType === "string" && input.mimeType.length > 0
      ? input.mimeType
      : "application/octet-stream";
  const folderId =
    typeof input.folderId === "string" && input.folderId.length > 0
      ? input.folderId
      : null;
  if (folderId) {
    const parent = await fetchFolderRow(folderId, context.workspaceId);
    if (!parent) {
      await utapi.deleteFiles(key).catch(() => {});
      return NextResponse.json({ error: "Folder not found" }, { status: 400 });
    }
  }

  const id = randomUUID();
  let createdAt: Date | null = null;
  const blocked = await db.transaction(async (tx) => {
    const rows = await tx
      .select({ total: sql<number>`coalesce(sum(${file.size}), 0)` })
      .from(file)
      .where(eq(file.workspaceId, context.workspaceId));
    const used = rows[0]?.total ?? 0;
    if (used + size > WORKSPACE_STORAGE_LIMIT) return true;
    const inserted = await tx
      .insert(file)
      .values({
        id,
        name,
        mimeType,
        size,
        storedName: key,
        folderId,
        workspaceId: context.workspaceId,
        uploaderId: self.id,
      })
      .returning({ createdAt: file.createdAt });
    createdAt = inserted[0]?.createdAt ?? new Date();
    return false;
  });
  if (blocked) {
    await utapi.deleteFiles(key).catch(() => {});
    return NextResponse.json(
      { error: "Workspace storage limit exceeded (100 MB)" },
      { status: 400 },
    );
  }

  return NextResponse.json<UploadFileResponse>({
    file: toFileItem({
      id,
      name,
      mimeType,
      size,
      storedName: key,
      uploaderName: self.name,
      createdAt: createdAt ?? new Date(),
    }),
  });
}
