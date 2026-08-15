import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: [
    "./db/schema.ts",
    "./db/chat.ts",
    "./db/tasks.ts",
    "./db/meetings.ts",
    "./db/files.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./sqlite.db",
  },
});
