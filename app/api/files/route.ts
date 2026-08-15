import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { db } from "@/db";
import { file } from "@/db/files";
import { getSessionUser } from "@/lib/chat-data";
import type { FilesResponse, UploadFileResponse } from "@/lib/file-types";
import { fetchFiles, toFileItem } from "@/lib/files-data";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_NAME_LENGTH = 180;

export async function GET() {
  const self = await getSessionUser();
  const files = await fetchFiles();
  return NextResponse.json<FilesResponse>({
    files,
    isPreview: !self,
  });
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const upload = form.get("file");
  if (!(upload instanceof File)) {
    return NextResponse.json(
      { error: "file is required as multipart/form-data" },
      { status: 400 },
    );
  }
  if (upload.size === 0) {
    return NextResponse.json({ error: "file is empty" }, { status: 400 });
  }
  if (upload.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "file exceeds the 25 MB limit" },
      { status: 400 },
    );
  }
  const name = upload.name.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "file name is invalid" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const ext = path.extname(upload.name).slice(0, 16);
  const storedName = `${id}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await upload.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  const row = await db
    .insert(file)
    .values({
      id,
      name,
      mimeType: upload.type || "application/octet-stream",
      size: upload.size,
      storedName,
      uploaderId: self.id,
    })
    .returning({ createdAt: file.createdAt });
  const createdAt = row[0]?.createdAt ?? new Date();

  return NextResponse.json<UploadFileResponse>({
    file: toFileItem({
      id,
      name,
      mimeType: upload.type || "application/octet-stream",
      size: upload.size,
      storedName,
      uploaderName: self.name,
      createdAt,
    }),
  });
}
