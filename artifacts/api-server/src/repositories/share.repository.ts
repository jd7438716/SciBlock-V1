/**
 * ShareRepository — raw database access for the shares table.
 *
 * Rules:
 *   - No business logic; no HTTP/Express imports.
 *   - Only Drizzle queries and plain data transformations.
 *   - Called exclusively from share.service.ts and routes/shares.ts.
 */

import { db } from "@workspace/db";
import { sharesTable, usersTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Share } from "@workspace/db/schema";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * RecipientView — a share record joined with the recipient's user identity.
 * Returned to the content owner when they query "who has access".
 */
export interface RecipientView {
  shareId: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/** Find a single share by primary key. Returns null when not found. */
export async function findShareById(id: string): Promise<Share | null> {
  const [row] = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Find a share by the (resourceType, resourceId, recipientId) triplet.
 * Used to enforce the unique constraint at the service layer before insert.
 */
export async function findExistingShare(
  resourceType: string,
  resourceId: string,
  recipientId: string,
): Promise<Share | null> {
  const [row] = await db
    .select()
    .from(sharesTable)
    .where(
      and(
        eq(sharesTable.resourceType, resourceType),
        eq(sharesTable.resourceId, resourceId),
        eq(sharesTable.recipientId, recipientId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * List all shares for a given resource, joined with recipient user info.
 * Returned to the content owner so they can display the "shared with" avatars.
 */
export async function listShareRecipients(
  resourceType: string,
  resourceId: string,
): Promise<RecipientView[]> {
  const rows = await db
    .select({
      shareId: sharesTable.id,
      userId: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: sharesTable.createdAt,
    })
    .from(sharesTable)
    .innerJoin(usersTable, eq(sharesTable.recipientId, usersTable.id))
    .where(
      and(
        eq(sharesTable.resourceType, resourceType),
        eq(sharesTable.resourceId, resourceId),
      ),
    )
    .orderBy(sharesTable.createdAt);

  return rows.map((r) => ({
    shareId: r.shareId,
    userId: r.userId,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Check whether a specific user has share access to a given resource.
 * Used by the report access-check middleware.
 */
export async function hasShareAccess(
  resourceType: string,
  resourceId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: sharesTable.id })
    .from(sharesTable)
    .where(
      and(
        eq(sharesTable.resourceType, resourceType),
        eq(sharesTable.resourceId, resourceId),
        eq(sharesTable.recipientId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/** Insert a new share record and return the persisted row. */
export async function insertShare(data: {
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  ownerId: string;
  recipientId: string;
}): Promise<Share> {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(sharesTable)
    .values({ id, ...data })
    .returning();
  return row;
}

/** Delete a share by primary key. Returns true if a row was deleted. */
export async function deleteShare(id: string): Promise<boolean> {
  const result = await db
    .delete(sharesTable)
    .where(eq(sharesTable.id, id))
    .returning({ id: sharesTable.id });
  return result.length > 0;
}
