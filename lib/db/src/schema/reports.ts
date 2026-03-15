import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { weeklyReportsTable } from "./students";

// ---------------------------------------------------------------------------
// report_comments — 周报评论 / 导师反馈
// ---------------------------------------------------------------------------

export const reportCommentsTable = pgTable("report_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reportId: text("report_id")
    .notNull()
    .references(() => weeklyReportsTable.id, { onDelete: "cascade" }),
  /**
   * ID of the comment author (typically an instructor user).
   * author_name and author_role are stored denormalised for display.
   *
   * TRANSITION: FK report_comments.author_id → users.id is deferred.
   * Current dev data contains historical rows with placeholder author_id
   * values ('u1', 'instructor-1') that predate proper user IDs. Until those
   * are cleaned up and the author_id semantics are stable, the FK is withheld.
   * Tracked for the next consolidation task.
   */
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  /** 'instructor' | 'student' */
  authorRole: text("author_role").notNull().default("instructor"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReportComment = typeof reportCommentsTable.$inferSelect;
export type InsertReportComment = typeof reportCommentsTable.$inferInsert;
