/**
 * calendarStats.ts — pure computation utilities for calendar status display.
 *
 * Layer: Pure utility (no React, no context, no side effects).
 *
 * Two responsibilities:
 *   1. dayStatusSet   — deduplicated status list for a single day's records.
 *   2. monthStatusCounts — per-status record count for the visible month.
 *
 * These are kept separate from calendarRecords.ts (which owns date-indexing)
 * and from calendarPanel.ts (which owns type definitions).
 */

import type { CalendarRecord, DateRecordMap } from "@/types/calendarPanel";
import type { ExperimentStatus } from "@/types/workbench";

// ---------------------------------------------------------------------------
// Canonical display order (matches Legend in CalendarPanel)
// ---------------------------------------------------------------------------

export const STATUS_ORDER: readonly ExperimentStatus[] = [
  "探索中",
  "可复现",
  "已验证",
  "失败",
];

// ---------------------------------------------------------------------------
// Day-level: unique status set
// ---------------------------------------------------------------------------

/**
 * Return the deduplicated set of statuses present for a single day's records,
 * ordered by STATUS_ORDER (not by insertion order).
 *
 * Used by CalendarGrid to render one colored dot per distinct status.
 * At most 4 dots can be returned (one per status).
 */
export function dayStatusSet(records: CalendarRecord[]): ExperimentStatus[] {
  const present = new Set(records.map((r) => r.experimentStatus));
  return STATUS_ORDER.filter((s) => present.has(s));
}

// ---------------------------------------------------------------------------
// Month-level: status counts
// ---------------------------------------------------------------------------

/**
 * Count occurrences of each ExperimentStatus across all records that fall
 * within the given calendar month (determined by the month's YYYY-MM prefix).
 *
 * All four statuses are always present in the return value; zero if no records.
 *
 * @param dateMap   The full date→record map produced by buildCalendarRecordMap.
 * @param month     Any Date whose year+month identifies the target month.
 */
export function monthStatusCounts(
  dateMap: DateRecordMap,
  month: Date,
): Record<ExperimentStatus, number> {
  const y = month.getFullYear();
  const m = String(month.getMonth() + 1).padStart(2, "0");
  const prefix = `${y}-${m}-`;

  const counts: Record<ExperimentStatus, number> = {
    "探索中": 0,
    "可复现": 0,
    "已验证": 0,
    "失败":   0,
  };

  for (const [dateStr, records] of dateMap.entries()) {
    if (!dateStr.startsWith(prefix)) continue;
    for (const r of records) {
      counts[r.experimentStatus] = (counts[r.experimentStatus] ?? 0) + 1;
    }
  }

  return counts;
}
