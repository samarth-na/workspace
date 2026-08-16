import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: [
    "./db/schema.ts",
    "./db/chat.ts",
    "./db/tasks.ts",
    "./db/meetings.ts",
    "./db/files.ts",
    "./db/workspace.ts",
    "./db/recents.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "file:./sqlite.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
