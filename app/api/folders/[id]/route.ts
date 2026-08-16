import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";
import type {
  DeleteFolderResponse,
  UpdateFolderResponse,
} from "@/lib/file-types";
import {
  deleteFolderTree,
  fetchFolderPath,
  fetchFolderRow,
  moveFolder,
  renameFolder,
} from "@/lib/files-data";
import { utapi } from "@/lib/uploadthing";
import { getSessionWorkspace } from "@/lib/workspace-data";

const MAX_NAME_LENGTH = 100;

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
  const row = await fetchFolderRow(id, context.workspaceId);
  if (!row) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }
  let input: { name?: unknown; parentId?: unknown };
  try {
    input = (await request.json()) as { name?: unknown; parentId?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "name is invalid" }, { status: 400 });
    }
    await renameFolder(id, name);
  }
  if (input.parentId !== undefined) {
    const parentId =
      input.parentId === null || input.parentId === ""
        ? null
        : typeof input.parentId === "string"
          ? input.parentId
          : null;
    if (parentId === id) {
      return NextResponse.json(
        { error: "A folder cannot be moved into itself" },
        { status: 400 },
      );
    }
    if (parentId && !(await fetchFolderRow(parentId, context.workspaceId))) {
      return NextResponse.json({ error: "Folder not found" }, { status: 400 });
    }
    const targetPath = await fetchFolderPath(parentId, context.workspaceId);
    if (targetPath.some((item) => item.id === id)) {
      return NextResponse.json(
        { error: "A folder cannot be moved into its own subfolder" },
        { status: 400 },
      );
    }
    await moveFolder(id, parentId);
  }
  const updated = await fetchFolderRow(id, context.workspaceId);
  if (!updated) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }
  return NextResponse.json<UpdateFolderResponse>({
    folder: {
      id: updated.id,
      name: updated.name,
      parentId: updated.parentId,
      childCount: 0,
      createdAt: updated.createdAt.getTime(),
    },
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
  const row = await fetchFolderRow(id, context.workspaceId);
  if (!row) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }
  const storedNames = await deleteFolderTree(id);
  await utapi.deleteFiles(storedNames).catch(() => {});
  return NextResponse.json<DeleteFolderResponse>({ ok: true });
}
