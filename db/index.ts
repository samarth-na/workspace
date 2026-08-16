import { createClient as createFileClient } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:./sqlite.db";

const client = url.startsWith("file:")
  ? createFileClient({ url })
  : createWebClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

export const db = drizzle(client);
