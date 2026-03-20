import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Database connection — exclusively uses EXTERNAL_DATABASE_URL.
//
// Replit's managed DATABASE_URL is intentionally NOT used as a fallback.
// Set EXTERNAL_DATABASE_URL in Replit Secrets to point at your PostgreSQL.
// ---------------------------------------------------------------------------

const connectionString = process.env.EXTERNAL_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[db] EXTERNAL_DATABASE_URL is not set. " +
    "Add it in Replit Secrets → EXTERNAL_DATABASE_URL=postgresql://user:pass@host:5432/db",
  );
}

/** Returns host:port/database from a PostgreSQL URL — never includes the password. */
function safeConnInfo(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const port = u.port || "5432";
    const name = u.pathname.replace(/^\//, "") || "(default)";
    return `${host}:${port}/${name}`;
  } catch {
    return "(unparseable URL)";
  }
}

console.info(`[db] source=EXTERNAL_DATABASE_URL  conn=${safeConnInfo(connectionString)}`);

export const pool = new Pool({ connectionString });
export const db   = drizzle(pool, { schema });

// ---------------------------------------------------------------------------
// Startup read probe — confirms tables are accessible immediately on import.
// Runs asynchronously; does NOT block module initialisation.
// ---------------------------------------------------------------------------
pool.query<{ cnt: string }>("SELECT COUNT(*)::text AS cnt FROM users")
  .then(({ rows }) => {
    console.info(`[db] read probe OK — users table row count: ${rows[0]?.cnt ?? "?"}`);
  })
  .catch((err: Error) => {
    console.warn(`[db] read probe FAILED — check DB connectivity: ${err.message}`);
  });

export * from "./schema";
