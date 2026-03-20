import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Connection string resolution
//
// EXTERNAL_DATABASE_URL takes priority over DATABASE_URL.
// This allows safe, reversible switching to an external database without
// removing the Replit-managed DATABASE_URL secret.
//
//   Set EXTERNAL_DATABASE_URL to point at your external PG instance.
//   Unset (or delete) it to fall back to the Replit internal database.
// ---------------------------------------------------------------------------

const externalUrl  = process.env.EXTERNAL_DATABASE_URL;
const internalUrl  = process.env.DATABASE_URL;
const connectionString = externalUrl || internalUrl;
const dbSource     = externalUrl ? "EXTERNAL_DATABASE_URL" : "DATABASE_URL";

if (!connectionString) {
  throw new Error(
    "[db] Neither EXTERNAL_DATABASE_URL nor DATABASE_URL is set. " +
    "Provision a database or set EXTERNAL_DATABASE_URL.",
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

console.info(`[db] source=${dbSource}  conn=${safeConnInfo(connectionString)}`);

export const pool = new Pool({ connectionString });
export const db   = drizzle(pool, { schema });

// ---------------------------------------------------------------------------
// Startup read probe — confirms tables are accessible immediately on import.
// Runs asynchronously; does NOT block module initialisation.
// Logs a warning (not a fatal error) so a transient hiccup doesn't crash the
// server before it can serve health-check requests.
// ---------------------------------------------------------------------------
pool.query<{ cnt: string }>("SELECT COUNT(*)::text AS cnt FROM users")
  .then(({ rows }) => {
    console.info(`[db] read probe OK — users table row count: ${rows[0]?.cnt ?? "?"}`);
  })
  .catch((err: Error) => {
    console.warn(`[db] read probe FAILED — check DB connectivity: ${err.message}`);
  });

export * from "./schema";
