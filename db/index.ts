import { createClient as createFileClient } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

const isProduction = process.env.NODE_ENV === "production";
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
const url = isProduction ? tursoUrl : (process.env.DATABASE_URL ?? tursoUrl);

if (isProduction && (!tursoUrl || !tursoAuthToken)) {
  throw new Error(
    "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production.",
  );
}

const dsn = url ?? "file:./sqlite.db";

if (isProduction && dsn.startsWith("file:")) {
  throw new Error("Local SQLite files are not supported in production.");
}

const client = dsn.startsWith("file:")
  ? createFileClient({ url: dsn })
  : createWebClient({ url: dsn, authToken: tursoAuthToken });

export const db = drizzle(client);
