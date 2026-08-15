import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { file } from "@/db/files";
import { user } from "@/db/schema";
import type { FileItem } from "@/lib/file-types";

export async function fetchFiles(): Promise<FileItem[]> {
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
    .orderBy(desc(file.createdAt));
  return rows.map(toFileItem);
}

export async function fetchFileRow(id: string) {
  const rows = await db.select().from(file).where(eq(file.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteFileRow(id: string) {
  await db.delete(file).where(eq(file.id, id));
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
    url: `/uploads/${row.storedName}`,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt.getTime(),
  };
}
