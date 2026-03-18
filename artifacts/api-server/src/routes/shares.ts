/**
 * 分享路由
 *
 * GET    /shares                    — 查询某内容的分享接收方列表（所有人专用）
 * POST   /shares                    — 创建分享（写入 share 记录 + 双向消息通知）
 * GET    /shares/:id                — 获取单条分享信息（所有人或接收方）
 * DELETE /shares/:id                — 撤销分享（所有人专用）
 *
 * 所有路由均受 requireAuth 保护（在 routes/index.ts 统一注册）。
 *
 * 职责边界:
 *   - 本文件只处理 HTTP 层（请求解析、参数校验、错误映射、响应格式化）。
 *   - 业务逻辑全部委托给 services/share.service.ts。
 */

import { Router } from "express";
import {
  createShare,
  revokeShare,
  getShareForRecipient,
  listRecipientsForOwner,
  ShareError,
} from "../services/share.service";

const router = Router();

// ---------------------------------------------------------------------------
// Error mapping helper
// ---------------------------------------------------------------------------

function handleShareError(res: ReturnType<typeof Router>["response"] extends never ? never : any, err: unknown) {
  if (err instanceof ShareError) {
    const statusMap: Record<string, number> = {
      not_found:              404,
      forbidden:              403,
      already_shared:         409,
      recipient_not_found:    404,
      cannot_share_with_self: 400,
    };
    res.status(statusMap[err.code] ?? 500).json({ error: err.code, message: err.message });
    return;
  }
  console.error("[shares] unexpected error:", err);
  res.status(500).json({ error: "server_error", message: "操作失败，请稍后重试。" });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /shares?resourceType=&resourceId=&ownerId=
 *
 * Returns the list of users this resource has been shared with.
 * ownerId in query is used to validate the caller is the content owner.
 */
router.get("/", async (req, res) => {
  const callerId = res.locals.userId as string;
  const { resourceType, resourceId, ownerId } = req.query as Record<string, string>;

  if (!resourceType || !resourceId || !ownerId) {
    res.status(400).json({
      error: "bad_request",
      message: "resourceType, resourceId, ownerId 为必填查询参数。",
    });
    return;
  }

  try {
    const recipients = await listRecipientsForOwner(resourceType, resourceId, callerId, ownerId);
    res.json({ recipients });
  } catch (err) {
    handleShareError(res, err);
  }
});

/**
 * GET /shares/:id
 *
 * Returns a single share record. Accessible by the owner or the recipient.
 * Used by the SharedContentPage to resolve share metadata before rendering.
 */
router.get("/:id", async (req, res) => {
  const callerId = res.locals.userId as string;
  const { id } = req.params;

  try {
    const share = await getShareForRecipient(id, callerId);
    res.json({ share });
  } catch (err) {
    handleShareError(res, err);
  }
});

/**
 * POST /shares
 *
 * Body: { resourceType, resourceId, resourceTitle, ownerId, ownerName, recipientEmail }
 */
router.post("/", async (req, res) => {
  const callerId = res.locals.userId as string;
  const callerName = res.locals.name as string;
  const {
    resourceType,
    resourceId,
    resourceTitle,
    recipientEmail,
  } = req.body as Record<string, string>;

  if (!resourceType || !resourceId || !resourceTitle || !recipientEmail) {
    res.status(400).json({
      error: "bad_request",
      message: "resourceType, resourceId, resourceTitle, recipientEmail 为必填字段。",
    });
    return;
  }

  if (resourceType !== "experiment_record" && resourceType !== "weekly_report") {
    res.status(400).json({
      error: "bad_request",
      message: "resourceType 必须为 experiment_record 或 weekly_report。",
    });
    return;
  }

  try {
    const share = await createShare({
      resourceType: resourceType as "experiment_record" | "weekly_report",
      resourceId,
      resourceTitle,
      ownerId: callerId,
      ownerName: callerName,
      recipientEmail,
    });
    res.status(201).json({ share });
  } catch (err) {
    handleShareError(res, err);
  }
});

/**
 * DELETE /shares/:id
 *
 * Revokes an existing share. Only the owner may call this.
 */
router.delete("/:id", async (req, res) => {
  const callerId = res.locals.userId as string;
  const { id } = req.params;

  try {
    await revokeShare(id, callerId);
    res.json({ success: true });
  } catch (err) {
    handleShareError(res, err);
  }
});

export default router;
