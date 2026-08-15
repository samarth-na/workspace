import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./sqlite.db",
});

export const db = drizzle(client);
