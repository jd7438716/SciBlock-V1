/**
 * calendarRecords.ts — data access layer for the calendar panel.
 *
 * Layer: API / data access (no React, no context).
 *
 * Reads ALL workbench records stored in sessionStorage (across every SciNote
 * visited in the current browser session) and returns an in-memory index
 * keyed by local date string (YYYY-MM-DD).
 *
 * Migration path to real backend:
 *   Replace the body of `loadAllCalendarRecords` with a fetch() call to
 *   GET /api/experiments?fields=id,sciNoteId,title,status,createdAt
 *   The return type and callers do not need to change.
 */

import type { CalendarRecord, DateRecordMap } from "@/types/calendarPanel";
import type { ExperimentRecord, ExperimentStatus } from "@/types/workbench";

// Must stay in sync with workbenchStorage.ts
const STORAGE_PREFIX = "sciblock:workbench:";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalDateStr(isoString: string): string {
  // Avoids timezone shifts by parsing the date portion directly
  return isoString.slice(0, 10);
}

function parseWorkbenchEntry(
  sciNoteId: string,
  raw: string,
): CalendarRecord[] {
  try {
    const records = JSON.parse(raw) as ExperimentRecord[];
    if (!Array.isArray(records)) return [];
    return records
      .filter((r) => r?.id && r?.createdAt)
      .map((r) => ({
        id: r.id,
        sciNoteId,
        title: r.title?.trim() || "（未命名实验）",
        experimentStatus: (r.experimentStatus ?? "探索中") as ExperimentStatus,
        createdAt: r.createdAt,
        dateStr: toLocalDateStr(r.createdAt),
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan sessionStorage for all workbench record sets and build a date index.
 * Called on every panel open to pick up newly confirmed records.
 */
export function loadAllCalendarRecords(): DateRecordMap {
  const map: DateRecordMap = new Map();

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;

    const sciNoteId = key.slice(STORAGE_PREFIX.length);
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;

    for (const rec of parseWorkbenchEntry(sciNoteId, raw)) {
      const list = map.get(rec.dateStr) ?? [];
      list.push(rec);
      map.set(rec.dateStr, list);
    }
  }

  return map;
}

/**
 * Return the N most-recent calendar days that have at least one record,
 * sorted newest-first. Used for the "recent experiments" section.
 */
export function getRecentDays(
  map: DateRecordMap,
  maxDays = 5,
): Array<{ dateStr: string; records: CalendarRecord[] }> {
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a)) // descending date
    .slice(0, maxDays)
    .map(([dateStr, records]) => ({ dateStr, records }));
}

/**
 * Format a YYYY-MM-DD string as a locale-friendly label.
 * e.g. "2026-03-14" → "3月14日 (周六)"
 */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("zh-CN", {
    month: "long",
    day:   "numeric",
    weekday: "short",
  });
}
