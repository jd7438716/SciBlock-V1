import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * shares — 内容分享记录
 *
 * 记录用户将自己的实验记录或周报分享给其他已注册用户的关系。
 *
 * resourceType 枚举:
 *   experiment_record — 实验记录（Go API 管理，experiment_records 表）
 *   weekly_report     — 周报（Express API 管理，weekly_reports 表）
 *
 * 约束:
 *   - 同一 (resourceType, resourceId, recipientId) 组合唯一，防止重复分享。
 *   - 删除 owner 或 recipient 账号时级联删除分享记录。
 */
export const sharesTable = pgTable("shares", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** 内容类型: 'experiment_record' | 'weekly_report' */
  resourceType: text("resource_type").notNull(),

  /** 内容主键（Go API experiment_records.id 或 weekly_reports.id） */
  resourceId: text("resource_id").notNull(),

  /**
   * 冗余存储的内容标题，用于消息通知和接收方页面标题。
   * 避免跨服务/跨表查询。
   */
  resourceTitle: text("resource_title").notNull(),

  /** 分享方 (内容所有人) */
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  /** 接收方 */
  recipientId: text("recipient_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Share = typeof sharesTable.$inferSelect;
export type InsertShare = typeof sharesTable.$inferInsert;
