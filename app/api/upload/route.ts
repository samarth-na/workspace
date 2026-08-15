import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/chat-data";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

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
  if (upload.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "image exceeds the 5 MB limit" },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME.has(upload.type)) {
    return NextResponse.json(
      { error: "unsupported image type" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const ext = path.extname(upload.name).slice(0, 16).toLowerCase();
  const storedName = `${id}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await upload.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  return NextResponse.json({ url: `/uploads/${storedName}` });
}
