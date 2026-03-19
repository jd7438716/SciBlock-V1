/**
 * calendarPanel.ts — type definitions for the UtilityRail calendar panel.
 *
 * Layer: Type definitions — no runtime logic.
 *
 * Kept separate from workbench.ts so the calendar feature can grow
 * independently (filters, range-select, export, etc.).
 *
 * Badge class maps (STATUS_DOT_CLASS, STATUS_TEXT_CLASS, STATUS_BG_CLASS)
 * have moved to utils/statusBadge.ts. Re-exported below for backward-compat
 * so existing `import { STATUS_DOT_CLASS } from "@/types/calendarPanel"` keeps
 * working without any import-path changes.
 */

import type { ExperimentStatus } from "@/types/workbench";

// Re-export badge maps from their canonical home.
export { STATUS_DOT_CLASS, STATUS_TEXT_CLASS, STATUS_BG_CLASS } from "@/utils/statusBadge";

// ---------------------------------------------------------------------------
// Core record shape as seen by the calendar panel
// ---------------------------------------------------------------------------

/**
 * Lightweight representation of an experiment record used by the calendar.
 * Derived from ExperimentRecord[] provided by WorkbenchContext; NOT the full ExperimentRecord.
 */
export interface CalendarRecord {
  id: string;
  /** The SciNote that owns this record — used to build the workbench navigation URL. */
  sciNoteId: string;
  title: string;
  experimentStatus: ExperimentStatus;
  /** ISO 8601 timestamp (from ExperimentRecord.createdAt). */
  createdAt: string;
  /** YYYY-MM-DD local date string derived from createdAt. */
  dateStr: string;
}

// ---------------------------------------------------------------------------
// Date → record index (the main in-memory structure)
// ---------------------------------------------------------------------------

/** Maps YYYY-MM-DD → CalendarRecord[] for all records found in the session. */
export type DateRecordMap = Map<string, CalendarRecord[]>;
