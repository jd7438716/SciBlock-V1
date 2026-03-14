/**
 * RecordDayList — shows experiment records for a specific selected date.
 *
 * Layer: Component (pure UI — reads props, emits navigate callback).
 *
 * Clicking a record navigates to that experiment's workbench.
 */

import React from "react";
import { FlaskConical } from "lucide-react";
import type { CalendarRecord } from "@/types/calendarPanel";
import { STATUS_DOT_CLASS, STATUS_BG_CLASS, STATUS_TEXT_CLASS } from "@/types/calendarPanel";
import { formatDateLabel } from "@/api/calendarRecords";

interface Props {
  dateStr:         string;
  records:         CalendarRecord[];
  currentSciNoteId?: string;
  onNavigate:      (sciNoteId: string, recordId: string) => void;
  onClear:         () => void;
}

export function RecordDayList({
  dateStr,
  records,
  currentSciNoteId,
  onNavigate,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">
          {formatDateLabel(dateStr)}
        </span>
        <button
          onClick={onClear}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          返回
        </button>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">该日期暂无实验记录</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {records.map((rec) => {
            const isSameNote = rec.sciNoteId === currentSciNoteId;
            return (
              <li key={rec.id}>
                <button
                  onClick={() => onNavigate(rec.sciNoteId, rec.id)}
                  className={[
                    "w-full text-left px-2.5 py-2 rounded-lg border transition-colors",
                    STATUS_BG_CLASS[rec.experimentStatus],
                    "hover:opacity-80",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-1.5">
                    <FlaskConical
                      size={11}
                      className={["flex-shrink-0 mt-0.5", STATUS_TEXT_CLASS[rec.experimentStatus]].join(" ")}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-gray-800 leading-tight truncate">
                        {rec.title}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={[
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            STATUS_DOT_CLASS[rec.experimentStatus],
                          ].join(" ")}
                        />
                        <span className={["text-[10px]", STATUS_TEXT_CLASS[rec.experimentStatus]].join(" ")}>
                          {rec.experimentStatus}
                        </span>
                        {!isSameNote && (
                          <span className="text-[10px] text-gray-400 ml-1">· 其他笔记</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
