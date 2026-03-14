/**
 * RecentRecords — shows the most-recent N calendar days that have records.
 *
 * Layer: Component (pure UI).
 *
 * Displayed in the calendar panel when no specific date is selected.
 * Each record row is clickable and calls `onNavigate`.
 */

import React from "react";
import { FlaskConical } from "lucide-react";
import type { CalendarRecord } from "@/types/calendarPanel";
import { STATUS_DOT_CLASS, STATUS_TEXT_CLASS } from "@/types/calendarPanel";
import { formatDateLabel } from "@/api/calendarRecords";

interface Props {
  recentDays: Array<{ dateStr: string; records: CalendarRecord[] }>;
  onNavigate: (sciNoteId: string, recordId: string) => void;
  onSelectDate: (dateStr: string) => void;
}

export function RecentRecords({ recentDays, onNavigate, onSelectDate }: Props) {
  if (recentDays.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-6 text-center">
        <FlaskConical size={24} className="text-gray-200" />
        <p className="text-xs text-gray-400">暂无实验记录</p>
        <p className="text-[10px] text-gray-300">确认模块数据后记录将自动出现</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-600">最近实验记录</p>
      {recentDays.map(({ dateStr, records }) => (
        <div key={dateStr} className="flex flex-col gap-1">
          {/* Date label — clickable to select that day on the calendar */}
          <button
            onClick={() => onSelectDate(dateStr)}
            className="text-left text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            {formatDateLabel(dateStr)}
          </button>

          {/* Record rows */}
          <ul className="flex flex-col gap-1">
            {records.map((rec) => (
              <li key={rec.id}>
                <button
                  onClick={() => onNavigate(rec.sciNoteId, rec.id)}
                  className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <span
                    className={[
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      STATUS_DOT_CLASS[rec.experimentStatus],
                    ].join(" ")}
                  />
                  <span className="text-xs text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                    {rec.title}
                  </span>
                  <span className={["ml-auto text-[10px] flex-shrink-0", STATUS_TEXT_CLASS[rec.experimentStatus]].join(" ")}>
                    {rec.experimentStatus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
