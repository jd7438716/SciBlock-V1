import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  /**
   * Migration output directory.
   * - `drizzle-kit generate` writes SQL files here.
   * - `drizzle-kit migrate` reads and applies files from here.
   * Must be committed to version control — this is the schema change history.
   *
   * Relative path from lib/db/ (where drizzle-kit is invoked).
   */
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
