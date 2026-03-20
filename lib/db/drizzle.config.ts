import { defineConfig } from "drizzle-kit";

// ---------------------------------------------------------------------------
// Drizzle migration config — exclusively uses EXTERNAL_DATABASE_URL.
//
// Replit's managed DATABASE_URL is intentionally NOT used as a fallback.
// Mirrors the runtime resolution in lib/db/src/index.ts so that
// `drizzle-kit generate` and `drizzle-kit migrate` always target the same
// database instance as the running API server.
// ---------------------------------------------------------------------------

const dbUrl = process.env.EXTERNAL_DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "EXTERNAL_DATABASE_URL is not set. " +
    "Add it in Replit Secrets → EXTERNAL_DATABASE_URL=postgresql://user:pass@host:5432/db",
  );
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
    url: dbUrl,
  },
});
