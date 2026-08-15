import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";
import type { CreateFolderResponse } from "@/lib/file-types";
import {
  createFolder,
  fetchAllFolders,
  fetchFolderRow,
  fetchFolders,
} from "@/lib/files-data";
import { getSessionWorkspace, previewWorkspaceId } from "@/lib/workspace-data";

const MAX_NAME_LENGTH = 100;

export async function GET(request: Request) {
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const url = new URL(request.url);
  const parentId = url.searchParams.get("parent") || null;
  const folders =
    url.searchParams.get("all") === "1"
      ? await fetchAllFolders(workspaceId)
      : await fetchFolders(parentId, workspaceId);
  return NextResponse.json({ folders, isPreview: !self });
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
  let input: { name?: unknown; parentId?: unknown };
  try {
    input = (await request.json()) as { name?: unknown; parentId?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "name is too long" }, { status: 400 });
  }
  const parentId =
    typeof input.parentId === "string" && input.parentId.length > 0
      ? input.parentId
      : null;
  if (parentId && !(await fetchFolderRow(parentId, context.workspaceId))) {
    return NextResponse.json({ error: "Folder not found" }, { status: 400 });
  }
  const folderItem = await createFolder(
    name,
    parentId,
    self.id,
    context.workspaceId,
  );
  return NextResponse.json<CreateFolderResponse>({ folder: folderItem });
}
