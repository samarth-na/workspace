import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq, like } from "drizzle-orm";
import { UTApi, UTFile } from "uploadthing/server";

import { db } from "@/db";
import { file } from "@/db/files";
import { user } from "@/db/schema";
import { workspace } from "@/db/workspace";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const LEGACY_STORED_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./;
const utapi = new UTApi();

function mimeFromName(name: string): string {
  const ext = path.extname(name).slice(1).toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] ?? "application/octet-stream";
}

async function uploadLegacyFile(
  storedName: string,
  mimeType: string,
): Promise<string | null> {
  const buffer = await readFile(path.join(UPLOAD_DIR, storedName)).catch(
    () => null,
  );
  if (!buffer) {
    console.error(`  missing on disk: ${storedName}`);
    return null;
  }
  try {
    const result = await utapi.uploadFiles(
      new UTFile([buffer], storedName, { type: mimeType }),
    );
    if (!result.data) {
      console.error(`  upload failed for ${storedName}:`, result.error);
      return null;
    }
    return result.data.key;
  } catch (error) {
    console.error(`  upload threw for ${storedName}:`, error);
    return null;
  }
}

async function existingKeys(names: Set<string>): Promise<Map<string, string>> {
  const existing = await utapi.listFiles({ limit: 500 });
  const map = new Map<string, string>();
  for (const f of existing.files) {
    if (names.has(f.name)) map.set(f.name, f.key);
  }
  return map;
}

async function main() {
  let filesMigrated = 0;
  let logosMigrated = 0;
  let avatarsMigrated = 0;

  const fileRows = await db.select().from(file);
  const legacyFiles = fileRows.filter((row) =>
    LEGACY_STORED_NAME.test(row.storedName),
  );
  const logoRows = await db
    .select()
    .from(workspace)
    .where(like(workspace.logo, "/uploads/%"));
  const avatarRows = await db
    .select()
    .from(user)
    .where(like(user.image, "/uploads/%"));

  const pendingNames = new Set<string>();
  for (const row of legacyFiles) pendingNames.add(row.storedName);
  for (const row of logoRows) pendingNames.add(path.basename(row.logo ?? ""));
  for (const row of avatarRows)
    pendingNames.add(path.basename(row.image ?? ""));
  const keysByName = await existingKeys(pendingNames);
  console.log(`Found ${keysByName.size} existing keys in UploadThing`);

  console.log(`Found ${legacyFiles.length} legacy file rows`);
  for (const row of legacyFiles) {
    const key =
      keysByName.get(row.storedName) ??
      (await uploadLegacyFile(row.storedName, row.mimeType));
    if (!key) continue;
    await db.update(file).set({ storedName: key }).where(eq(file.id, row.id));
    filesMigrated += 1;
    console.log(`  [ok] ${row.name} -> ${key}`);
  }

  console.log(`Found ${logoRows.length} legacy workspace logos`);
  for (const row of logoRows) {
    const storedName = path.basename(row.logo ?? "");
    const key =
      keysByName.get(storedName) ??
      (await uploadLegacyFile(storedName, mimeFromName(storedName)));
    if (!key) continue;
    await db
      .update(workspace)
      .set({ logo: `https://utfs.io/f/${key}` })
      .where(eq(workspace.id, row.id));
    logosMigrated += 1;
    console.log(`  [ok] ${row.name} logo -> ${key}`);
  }

  console.log(`Found ${avatarRows.length} legacy user avatars`);
  for (const row of avatarRows) {
    const storedName = path.basename(row.image ?? "");
    const key =
      keysByName.get(storedName) ??
      (await uploadLegacyFile(storedName, mimeFromName(storedName)));
    if (!key) continue;
    await db
      .update(user)
      .set({ image: `https://utfs.io/f/${key}` })
      .where(eq(user.id, row.id));
    avatarsMigrated += 1;
    console.log(`  [ok] ${row.name} avatar -> ${key}`);
  }

  console.log(
    `Migrated ${filesMigrated} files, ${logosMigrated} logos, ${avatarsMigrated} avatars`,
  );
}

await main();
