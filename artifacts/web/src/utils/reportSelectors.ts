/**
 * reportSelectors.ts — pure predicate functions for WeeklyReport business rules.
 *
 * Layer: utils / domain selectors
 *
 * Rules:
 *   - No side-effects, no imports of React or UI libraries.
 *   - Accept WeeklyReport (or a Pick<> of it) — never raw field values.
 *   - Replace all inline `report.datesLastSavedAt != null` bare checks in
 *     components and hooks with the named functions below.
 *
 * Usage:
 *   import { isNewDateModel, isReportEditable } from "@/utils/reportSelectors";
 */

import type { WeeklyReport, WeeklyReportStatus } from "@/types/weeklyReport";

// ---------------------------------------------------------------------------
// Date-model selectors
// ---------------------------------------------------------------------------

/**
 * Returns true when the report uses the new multi-date selection model.
 * Sentinel: datesLastSavedAt IS NOT NULL (the backend stamps this on the first
 * PUT /reports/:id/dates call).
 */
export function isNewDateModel(report: Pick<WeeklyReport, "datesLastSavedAt">): boolean {
  return report.datesLastSavedAt != null;
}

/**
 * Returns true when the report uses the legacy date-range model.
 * Inverse of isNewDateModel — provided for readability at call sites.
 */
export function isOldDateModel(report: Pick<WeeklyReport, "datesLastSavedAt">): boolean {
  return report.datesLastSavedAt == null;
}

/**
 * Returns true when the report's experiment links have been explicitly managed
 * at least once via PUT /reports/:id/links.
 * Sentinel: linksLastSavedAt IS NOT NULL.
 */
export function hasLinksBeenManaged(report: Pick<WeeklyReport, "linksLastSavedAt">): boolean {
  return report.linksLastSavedAt != null;
}

// ---------------------------------------------------------------------------
// Edit-permission selectors
// ---------------------------------------------------------------------------

/** Status values that allow the student to edit and re-submit the report. */
const EDITABLE_STATUSES: WeeklyReportStatus[] = ["draft", "needs_revision"];

/**
 * Returns true when the student is allowed to edit and submit the report.
 * Only draft and needs_revision reports are editable.
 */
export function isReportEditable(report: Pick<WeeklyReport, "status">): boolean {
  return (EDITABLE_STATUSES as string[]).includes(report.status);
}

/**
 * Returns true when the report has been submitted (status is not draft).
 */
export function isReportSubmitted(report: Pick<WeeklyReport, "status">): boolean {
  return report.status !== "draft";
}

/**
 * Returns true when the instructor has completed their review
 * (approved or requested revision).
 */
export function isReportReviewed(report: Pick<WeeklyReport, "status">): boolean {
  return report.status === "reviewed" || report.status === "needs_revision";
}
