import { createClient as createFileClient } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL)
  : (process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL);

if (!url && isProduction) {
  throw new Error(
    "Database URL is missing. Set TURSO_DATABASE_URL (or DATABASE_URL) for production.",
  );
}

const dsn = url ?? "file:./sqlite.db";

const client = dsn.startsWith("file:")
  ? createFileClient({ url: dsn })
  : createWebClient({ url: dsn, authToken: process.env.TURSO_AUTH_TOKEN });

export const db = drizzle(client);
