/**
 * CalendarGrid — custom month calendar grid.
 *
 * Layer: Component (pure UI — no context, no hooks beyond props).
 *
 * Avoids the shadcn Calendar (react-day-picker) to retain full styling
 * control over coloured dots, status indicators, and compact layout.
 *
 * Features:
 *   - Prev / Next month navigation
 *   - Today highlighted with a ring
 *   - Selected date highlighted in dark
 *   - Coloured dot(s) beneath days that have experiment records
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarRecord, DateRecordMap } from "@/types/calendarPanel";
import { STATUS_DOT_CLASS } from "@/types/calendarPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const TODAY_STR = toDateStr(new Date());

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build the grid cells for a given month. Null = empty leading/trailing cell. */
function buildCells(year: number, month: number): Array<Date | null> {
  const firstDay   = new Date(year, month, 1).getDay();       // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Pick the dominant dot colour from a list of records for one day. */
function dominantDotClass(records: CalendarRecord[]): string {
  const order: Array<CalendarRecord["experimentStatus"]> = [
    "已验证", "可复现", "探索中", "失败",
  ];
  for (const s of order) {
    if (records.some((r) => r.experimentStatus === s)) return STATUS_DOT_CLASS[s];
  }
  return "bg-gray-400";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  currentMonth:  Date;
  selectedDate:  Date | null;
  dateMap:       DateRecordMap;
  onPrevMonth:   () => void;
  onNextMonth:   () => void;
  onSelectDate:  (d: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  dateMap,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: Props) {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = buildCells(year, month);

  const monthLabel = currentMonth.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  const selectedStr = selectedDate ? toDateStr(selectedDate) : null;

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="上个月"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-gray-700">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="下个月"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const dateStr     = toDateStr(date);
          const records     = dateMap.get(dateStr);
          const hasRecords  = !!records?.length;
          const isToday     = dateStr === TODAY_STR;
          const isSelected  = dateStr === selectedStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={[
                "relative flex flex-col items-center justify-center h-8 w-full rounded-lg transition-colors text-xs font-medium",
                isSelected
                  ? "bg-gray-900 text-white"
                  : isToday
                  ? "bg-gray-100 text-gray-900 ring-1 ring-gray-300"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              <span>{date.getDate()}</span>

              {/* Record dot */}
              {hasRecords && !isSelected && (
                <span
                  className={[
                    "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    dominantDotClass(records!),
                  ].join(" ")}
                />
              )}
              {hasRecords && isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
