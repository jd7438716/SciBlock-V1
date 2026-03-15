/**
 * 消息路由
 *
 * GET    /api/messages           — 获取当前用户的所有非删除消息
 * PATCH  /api/messages/:id/read  — 标记为已读
 * PATCH  /api/messages/:id/action— 接受或拒绝（邀请/分享请求）
 * DELETE /api/messages/:id       — 软删除
 *
 * 所有路由均受 requireAuth 中间件保护（在 routes/index.ts 中统一注册）。
 * 用户身份从 res.locals.userId 读取，不再依赖 X-User-Id header。
 *
 * Initial message data is populated by bash scripts/seed-dev.sh — not by HTTP routes.
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db/schema";
import { eq, and, ne } from "drizzle-orm";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET /api/messages — list non-deleted messages for the current user */
router.get("/", async (req, res) => {
  const userId = res.locals.userId;

  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.recipientId, userId),
          ne(messagesTable.status, "deleted"),
        ),
      )
      .orderBy(messagesTable.createdAt);

    res.json({ messages: messages.slice().reverse() });
  } catch (err) {
    console.error("[messages] GET error:", err);
    res.status(500).json({ error: "server_error", message: "获取消息失败" });
  }
});

/** PATCH /api/messages/:id/read */
router.patch("/:id/read", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  try {
    await db
      .update(messagesTable)
      .set({ status: "read" })
      .where(
        and(
          eq(messagesTable.id, id),
          eq(messagesTable.recipientId, userId),
          eq(messagesTable.status, "unread"),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    console.error("[messages] PATCH read error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/** PATCH /api/messages/:id/action — accept or reject */
router.patch("/:id/action", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { action } = req.body as { action?: string };

  if (action !== "accepted" && action !== "rejected") {
    res.status(400).json({ error: "bad_request", message: "action must be accepted or rejected" });
    return;
  }

  try {
    await db
      .update(messagesTable)
      .set({ status: action })
      .where(
        and(
          eq(messagesTable.id, id),
          eq(messagesTable.recipientId, userId),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    console.error("[messages] PATCH action error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/** DELETE /api/messages/:id — soft delete */
router.delete("/:id", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  try {
    await db
      .update(messagesTable)
      .set({ status: "deleted" })
      .where(
        and(
          eq(messagesTable.id, id),
          eq(messagesTable.recipientId, userId),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    console.error("[messages] DELETE error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
