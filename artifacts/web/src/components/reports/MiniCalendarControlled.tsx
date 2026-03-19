/**
 * MiniCalendarControlled — controlled mini calendar for single-date toggle.
 *
 * Layer: pure display component (no fetch, no state)
 *
 * Props:
 *   selectedDates — the currently selected dates (controlled)
 *   onToggle      — called when the user clicks a day cell
 *   experimentDates — dates that have experiment records (shown as dots)
 *   viewYear / viewMonth / onViewChange — controlled month navigation
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type DateStr,
  todayISO, toISO, daysInMonth, firstDayOfWeek, fmtMonthLabel,
} from "@/utils/calendarUtils";

interface MiniCalendarControlledProps {
  selectedDates: Set<DateStr>;
  onToggle: (d: DateStr) => void;
  experimentDates: Set<DateStr>;
  viewYear: number;
  viewMonth: number;
  onViewChange: (y: number, m: number) => void;
}

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function MiniCalendarControlled({
  selectedDates,
  onToggle,
  experimentDates,
  viewYear,
  viewMonth,
  onViewChange,
}: MiniCalendarControlledProps) {
  const today    = todayISO();
  const dayCount = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: dayCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    viewMonth === 1
      ? onViewChange(viewYear - 1, 12)
      : onViewChange(viewYear, viewMonth - 1);
  }
  function nextMonth() {
    viewMonth === 12
      ? onViewChange(viewYear + 1, 1)
      : onViewChange(viewYear, viewMonth + 1);
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {fmtMonthLabel(viewYear, viewMonth)}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-gray-400 py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`b-${idx}`} />;
          const iso        = toISO(viewYear, viewMonth, day);
          const isFuture   = iso > today;
          const isSelected = selectedDates.has(iso);
          const hasDot     = experimentDates.has(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={isFuture}
              onClick={() => !isFuture && onToggle(iso)}
              className={`relative mx-auto flex flex-col items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                ${isFuture
                  ? "text-gray-200 cursor-not-allowed"
                  : isSelected
                    ? "bg-violet-600 text-white shadow-sm"
                    : iso === today
                      ? "ring-1 ring-violet-400 text-violet-700 hover:bg-violet-50"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {day}
              {hasDot && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? "bg-violet-300" : "bg-violet-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
