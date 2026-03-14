/**
 * useCalendarPanel — business logic hook for the UtilityRail calendar panel.
 *
 * Layer: Business logic (no UI, no direct API calls from components).
 *
 * Responsibilities:
 *   - Load and refresh the date→record index from calendarRecords API
 *   - Manage selected date + current month navigation state
 *   - Derive selectedRecords and recentDays for rendering
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadAllCalendarRecords,
  getRecentDays,
} from "@/api/calendarRecords";
import type { CalendarRecord, DateRecordMap } from "@/types/calendarPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface CalendarPanelState {
  dateMap:         DateRecordMap;
  selectedDate:    Date | null;
  selectedDateStr: string | null;
  selectedRecords: CalendarRecord[];
  currentMonth:    Date;
  recentDays:      Array<{ dateStr: string; records: CalendarRecord[] }>;
  markedDates:     Set<string>;
  // actions
  selectDate:      (d: Date | null) => void;
  prevMonth:       () => void;
  nextMonth:       () => void;
  refresh:         () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param isOpen Whether the calendar panel is currently visible.
 *   Re-loads data every time the panel is opened to catch newly confirmed records.
 */
export function useCalendarPanel(isOpen: boolean): CalendarPanelState {
  const [dateMap, setDateMap]       = useState<DateRecordMap>(new Map());
  const [selectedDate, setSelected] = useState<Date | null>(null);
  const [currentMonth, setMonth]    = useState<Date>(() => startOfMonth(new Date()));

  const refresh = useCallback(() => {
    setDateMap(loadAllCalendarRecords());
  }, []);

  // Re-load every time the panel opens
  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  const selectedDateStr = selectedDate ? toDateStr(selectedDate) : null;
  const selectedRecords = selectedDateStr
    ? (dateMap.get(selectedDateStr) ?? [])
    : [];

  const recentDays = getRecentDays(dateMap, 5);
  const markedDates = new Set(dateMap.keys());

  function selectDate(d: Date | null) {
    setSelected(d);
    // Navigate month to the clicked date's month
    if (d) setMonth(startOfMonth(d));
  }

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return {
    dateMap,
    selectedDate,
    selectedDateStr,
    selectedRecords,
    currentMonth,
    recentDays,
    markedDates,
    selectDate,
    prevMonth,
    nextMonth,
    refresh,
  };
}
