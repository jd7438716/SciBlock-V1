import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
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

// ---------------------------------------------------------------------------
// weekly_report_experiment_links — 周报 ↔ 实验记录 显式关联
//
// Stores the explicit, student-confirmed set of experiment records associated
// with a weekly report.  This is the source of truth for the linkage —
// not a dynamic query result.
//
// Design notes:
//  - report_id has a CASCADE FK into weekly_reports.id so links are cleaned
//    up automatically when a report is deleted.
//  - experiment_record_id has NO FK constraint because experiment_records is
//    owned by the Go API service (cross-service boundary).  Existence/ownership
//    is validated at the application layer (PUT /reports/:id/links).
//  - A (report_id, experiment_record_id) UNIQUE constraint prevents duplicates.
//  - The candidate set for selection is generated separately via
//    GET /reports/preview (currently based on created_at, extensible later).
// ---------------------------------------------------------------------------

export const reportExperimentLinksTable = pgTable(
  "weekly_report_experiment_links",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reportId: text("report_id")
      .notNull()
      .references(() => weeklyReportsTable.id, { onDelete: "cascade" }),
    /** experiment_records.id (Go API domain — no DB-level FK) */
    experimentRecordId: text("experiment_record_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqLink: unique("uq_report_experiment_link").on(t.reportId, t.experimentRecordId),
  }),
);

export type ReportExperimentLink = typeof reportExperimentLinksTable.$inferSelect;
export type InsertReportExperimentLink = typeof reportExperimentLinksTable.$inferInsert;
