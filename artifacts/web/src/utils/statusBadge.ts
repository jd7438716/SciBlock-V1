/**
 * statusBadge.ts — Tailwind class maps for ExperimentStatus visual indicators.
 *
 * Layer: utils (runtime constants, no React dependency)
 *
 * Centralises all "status → CSS class" maps so badge styles are defined
 * exactly once. Import from here instead of duplicating in each component.
 *
 * Usage:
 *   import { STATUS_DOT_CLASS, EXP_STATUS_PILL } from "@/utils/statusBadge";
 */

import type { ExperimentStatus } from "@/types/experiment";

// ---------------------------------------------------------------------------
// Calendar context — dot / text / background badges
// Previously lived in types/calendarPanel.ts; moved here so badge styling
// is co-located with other badge maps and out of the types layer.
// types/calendarPanel.ts re-exports these for backward-compat.
// ---------------------------------------------------------------------------

/** Small coloured dot — used in CalendarGrid and RecordDayList cells. */
export const STATUS_DOT_CLASS: Record<ExperimentStatus, string> = {
  "探索中": "bg-blue-500",
  "可复现": "bg-green-500",
  "失败":   "bg-red-400",
  "已验证": "bg-purple-500",
};

/** Text colour — used alongside dots or standalone status labels. */
export const STATUS_TEXT_CLASS: Record<ExperimentStatus, string> = {
  "探索中": "text-blue-600",
  "可复现": "text-green-600",
  "失败":   "text-red-500",
  "已验证": "text-purple-600",
};

/** Background + border — used as row highlight in RecordDayList. */
export const STATUS_BG_CLASS: Record<ExperimentStatus, string> = {
  "探索中": "bg-blue-50 border-blue-200",
  "可复现": "bg-green-50 border-green-200",
  "失败":   "bg-red-50 border-red-200",
  "已验证": "bg-purple-50 border-purple-200",
};

// ---------------------------------------------------------------------------
// Report / linked-experiment context — rounded pill badges
// Previously lived in types/weeklyReport.ts as EXP_STATUS_COLORS.
// types/weeklyReport.ts re-exports this for backward-compat.
// ---------------------------------------------------------------------------

/**
 * Rounded pill badge used when displaying experiment status inside
 * linked-experiment lists in ReportWorkPanel and ReportCard.
 */
export const EXP_STATUS_PILL: Record<string, string> = {
  "探索中": "bg-blue-50 text-blue-700",
  "可复现": "bg-purple-50 text-purple-700",
  "已验证": "bg-green-50 text-green-700",
  "失败":   "bg-red-50 text-red-700",
};
