import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { file, folder } from "@/db/files";
import { user } from "@/db/schema";
import type { FileItem, FolderItem, FolderPathItem } from "@/lib/file-types";
import { fileUrl } from "@/lib/file-url";

export const WORKSPACE_STORAGE_LIMIT = 100 * 1024 * 1024;

export async function fetchWorkspaceStorageUsed(
  workspaceId: string,
): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${file.size}), 0)` })
    .from(file)
    .where(eq(file.workspaceId, workspaceId));
  return rows[0]?.total ?? 0;
}

export async function fetchFiles(
  folderId: string | null,
  workspaceId: string | null,
): Promise<FileItem[]> {
  const rows = await db
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
    .where(
      and(
        folderId ? eq(file.folderId, folderId) : isNull(file.folderId),
        workspaceId ? eq(file.workspaceId, workspaceId) : undefined,
      ),
    )
    .orderBy(desc(file.createdAt));
  return rows.map(toFileItem);
}

export async function fetchChildCounts(
  folderIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (folderIds.length === 0) return map;
  const [fileCounts, folderCounts] = await Promise.all([
    db
      .select({ folderId: file.folderId, value: count() })
      .from(file)
      .where(inArray(file.folderId, folderIds))
      .groupBy(file.folderId),
    db
      .select({ parentId: folder.parentId, value: count() })
      .from(folder)
      .where(inArray(folder.parentId, folderIds))
      .groupBy(folder.parentId),
  ]);
  for (const row of fileCounts) {
    if (!row.folderId) continue;
    map.set(row.folderId, (map.get(row.folderId) ?? 0) + row.value);
  }
  for (const row of folderCounts) {
    if (!row.parentId) continue;
    map.set(row.parentId, (map.get(row.parentId) ?? 0) + row.value);
  }
  return map;
}

export async function fetchAllFiles(
  workspaceId: string | null,
): Promise<FileItem[]> {
  const rows = await db
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
    .where(workspaceId ? eq(file.workspaceId, workspaceId) : undefined)
    .orderBy(desc(file.createdAt));
  return rows.map(toFileItem);
}

export async function fetchFolders(
  folderId: string | null,
  workspaceId: string | null,
): Promise<FolderItem[]> {
  const rows = await db
    .select()
    .from(folder)
    .where(
      and(
        folderId ? eq(folder.parentId, folderId) : isNull(folder.parentId),
        workspaceId ? eq(folder.workspaceId, workspaceId) : undefined,
      ),
    )
    .orderBy(folder.name);
  const counts = await fetchChildCounts(rows.map((row) => row.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    childCount: counts.get(row.id) ?? 0,
    createdAt: row.createdAt.getTime(),
  }));
}

export async function fetchAllFolders(
  workspaceId: string | null,
): Promise<FolderItem[]> {
  const rows = await db
    .select()
    .from(folder)
    .where(workspaceId ? eq(folder.workspaceId, workspaceId) : undefined)
    .orderBy(folder.name);
  const counts = await fetchChildCounts(rows.map((row) => row.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    childCount: counts.get(row.id) ?? 0,
    createdAt: row.createdAt.getTime(),
  }));
}

export async function fetchFolderPath(
  folderId: string | null,
  workspaceId: string | null,
): Promise<FolderPathItem[]> {
  if (!folderId) return [];
  const path: FolderPathItem[] = [];
  let current: { id: string; name: string; parentId: string | null } | null =
    await fetchFolderRow(folderId, workspaceId);
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    current = current.parentId
      ? await fetchFolderRow(current.parentId, workspaceId)
      : null;
  }
  return path;
}

export async function fetchFolderRow(id: string, workspaceId?: string | null) {
  const rows = await db
    .select()
    .from(folder)
    .where(
      and(
        eq(folder.id, id),
        workspaceId ? eq(folder.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function fetchFileRow(id: string, workspaceId?: string | null) {
  const rows = await db
    .select()
    .from(file)
    .where(
      and(
        eq(file.id, id),
        workspaceId ? eq(file.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createFolder(
  name: string,
  parentId: string | null,
  ownerId: string,
  workspaceId: string,
) {
  const id = crypto.randomUUID();
  await db.insert(folder).values({ id, name, parentId, ownerId, workspaceId });
  return {
    id,
    name,
    parentId,
    childCount: 0,
    createdAt: Date.now(),
  };
}

export async function renameFolder(id: string, name: string) {
  await db.update(folder).set({ name }).where(eq(folder.id, id));
}

export async function moveFolder(id: string, parentId: string | null) {
  await db.update(folder).set({ parentId }).where(eq(folder.id, id));
}

export async function deleteFolderTree(id: string): Promise<string[]> {
  const children = await db
    .select({ id: folder.id })
    .from(folder)
    .where(eq(folder.parentId, id));
  let storedNames: string[] = [];
  for (const child of children) {
    storedNames = storedNames.concat(await deleteFolderTree(child.id));
  }
  const rows = await db
    .select({ storedName: file.storedName })
    .from(file)
    .where(eq(file.folderId, id));
  await db.delete(file).where(eq(file.folderId, id));
  storedNames = storedNames.concat(rows.map((row) => row.storedName));
  await db.delete(folder).where(eq(folder.id, id));
  return storedNames;
}

export async function renameFile(id: string, name: string) {
  await db.update(file).set({ name }).where(eq(file.id, id));
}

export async function moveFile(id: string, folderId: string | null) {
  await db.update(file).set({ folderId }).where(eq(file.id, id));
}

export async function deleteFileRow(id: string) {
  const rows = await db
    .select({ storedName: file.storedName })
    .from(file)
    .where(eq(file.id, id));
  await db.delete(file).where(eq(file.id, id));
  return rows[0]?.storedName ?? null;
}

export function toFileItem(row: {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storedName: string;
  uploaderName: string;
  createdAt: Date;
}): FileItem {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mimeType,
    size: row.size,
    url: fileUrl(row.storedName),
    uploaderName: row.uploaderName,
    createdAt: row.createdAt.getTime(),
  };
}
