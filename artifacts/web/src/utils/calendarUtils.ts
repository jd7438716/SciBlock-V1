/**
 * calendarUtils.ts — pure date/calendar helper functions.
 *
 * Layer: utils (no React, no side-effects)
 *
 * Shared between ReportWorkPanel sub-components and GenerateReportWizard.
 * Previously these were inline functions duplicated inside each file.
 */

export type DateStr = string; // YYYY-MM-DD

export function todayISO(): DateStr {
  return new Date().toISOString().slice(0, 10);
}

export function toISO(y: number, m: number, d: number): DateStr {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function firstDayOfWeek(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay();
}

export function fmtMonthLabel(y: number, m: number): string {
  return `${y}年${m}月`;
}
