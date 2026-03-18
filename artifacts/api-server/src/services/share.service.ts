/**
 * ShareService — business logic for the share feature.
 *
 * Rules:
 *   - No HTTP/Express imports; no direct DB access (delegates to repositories).
 *   - Orchestrates share creation, messaging, and access validation.
 *   - All error conditions throw a typed AppError so the route layer can map
 *     them to the correct HTTP status without knowing business details.
 */

import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  findExistingShare,
  findShareById,
  insertShare,
  deleteShare,
  listShareRecipients,
  type RecipientView,
} from "../repositories/share.repository";
import type { Share } from "@workspace/db/schema";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type ShareErrorCode =
  | "not_found"
  | "forbidden"
  | "already_shared"
  | "recipient_not_found"
  | "cannot_share_with_self";

export class ShareError extends Error {
  constructor(
    public readonly code: ShareErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ShareError";
  }
}

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface CreateShareInput {
  resourceType: "experiment_record" | "weekly_report";
  resourceId: string;
  resourceTitle: string;
  ownerId: string;
  ownerName: string;
  recipientEmail: string;
}

export interface ShareWithRecipients {
  share: Share;
  recipients: RecipientView[];
}

// ---------------------------------------------------------------------------
// Service operations
// ---------------------------------------------------------------------------

/**
 * createShare — validates then persists a new share record.
 *
 * Side effects:
 *   1. Inserts a row into `shares`.
 *   2. Writes a notification to the recipient's inbox (type: experiment_shared / report_shared).
 *   3. Writes a tracking message to the owner's inbox (type: share_sent).
 */
export async function createShare(input: CreateShareInput): Promise<Share> {
  const { resourceType, resourceId, resourceTitle, ownerId, ownerName, recipientEmail } = input;

  // 1. Resolve recipient by email.
  const [recipientUser] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, recipientEmail.toLowerCase().trim()))
    .limit(1);

  if (!recipientUser) {
    throw new ShareError("recipient_not_found", "找不到该邮箱对应的账号，请检查后重试。");
  }

  // 2. Prevent sharing with oneself.
  if (recipientUser.id === ownerId) {
    throw new ShareError("cannot_share_with_self", "不能将内容分享给自己。");
  }

  // 3. Enforce unique share — one owner can only share a given resource to a recipient once.
  const existing = await findExistingShare(resourceType, resourceId, recipientUser.id);
  if (existing) {
    throw new ShareError("already_shared", `已分享给 ${recipientUser.name}，无需重复操作。`);
  }

  // 4. Persist the share record.
  const share = await insertShare({
    resourceType,
    resourceId,
    resourceTitle,
    ownerId,
    recipientId: recipientUser.id,
  });

  // 5. Notify recipient in their inbox.
  const recipientMsgType = resourceType === "experiment_record" ? "experiment_shared" : "report_shared";
  await db.insert(messagesTable).values({
    id: crypto.randomUUID(),
    recipientId: recipientUser.id,
    senderName: ownerName,
    type: recipientMsgType,
    status: "unread",
    title: `${ownerName} 与你分享了${resourceType === "experiment_record" ? "实验记录" : "周报"}`,
    body: `《${resourceTitle}》`,
    metadata: {
      shareId: share.id,
      resourceType,
      resourceId,
      resourceTitle,
      ownerName,
    },
  });

  // 6. Write a tracking message to the owner's own inbox.
  await db.insert(messagesTable).values({
    id: crypto.randomUUID(),
    recipientId: ownerId,
    senderName: "系统",
    type: "share_sent",
    status: "read",
    title: `你分享了${resourceType === "experiment_record" ? "实验记录" : "周报"}`,
    body: `《${resourceTitle}》已分享给 ${recipientUser.name}`,
    metadata: {
      shareId: share.id,
      resourceType,
      resourceId,
      resourceTitle,
      recipientName: recipientUser.name,
      recipientEmail: recipientUser.email,
    },
  });

  return share;
}

/**
 * revokeShare — removes a share record.
 *
 * Only the content owner may revoke. Throws ShareError when the share
 * does not exist or the caller is not the owner.
 */
export async function revokeShare(shareId: string, callerId: string): Promise<void> {
  const share = await findShareById(shareId);
  if (!share) {
    throw new ShareError("not_found", "分享记录不存在。");
  }
  if (share.ownerId !== callerId) {
    throw new ShareError("forbidden", "只有内容所有人才能撤销分享。");
  }
  await deleteShare(shareId);
}

/**
 * getShareForRecipient — validates that the caller is the intended recipient
 * and returns the share record. Used by the shared content viewer.
 */
export async function getShareForRecipient(
  shareId: string,
  callerId: string,
): Promise<Share> {
  const share = await findShareById(shareId);
  if (!share) {
    throw new ShareError("not_found", "分享记录不存在或已被撤销。");
  }
  // Both the owner and the recipient may fetch share details.
  if (share.ownerId !== callerId && share.recipientId !== callerId) {
    throw new ShareError("forbidden", "无权限查看此分享。");
  }
  return share;
}

/**
 * listRecipientsForOwner — returns who the owner has shared a resource with.
 * Validates ownership before returning.
 */
export async function listRecipientsForOwner(
  resourceType: string,
  resourceId: string,
  callerId: string,
  ownerId: string,
): Promise<RecipientView[]> {
  if (ownerId !== callerId) {
    throw new ShareError("forbidden", "只有内容所有人才能查看分享列表。");
  }
  return listShareRecipients(resourceType, resourceId);
}
