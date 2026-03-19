/**
 * DateEditModal — modal for editing the selected dates of a weekly report.
 *
 * Layer: business component (fetches experiment-date dots, saves dates)
 *
 * Props:
 *   reportId     — the report whose dates are being edited
 *   currentDates — dates already saved (pre-populates selection)
 *   onSaved      — called with the new sorted dates after a successful save
 *   onClose      — called when the user dismisses the modal
 */

import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { MiniCalendarControlled } from "./MiniCalendarControlled";
import { saveReportDates, fetchExperimentDates } from "@/api/weeklyReport";
import { fmtDate } from "@/types/weeklyReport";
import { type DateStr, todayISO } from "@/utils/calendarUtils";

interface DateEditModalProps {
  reportId: string;
  currentDates: string[];
  onSaved: (dates: string[]) => void;
  onClose: () => void;
}

export function DateEditModal({
  reportId,
  currentDates,
  onSaved,
  onClose,
}: DateEditModalProps) {
  const today    = todayISO();
  const todayObj = new Date(today);

  const [viewYear,  setViewYear]  = useState(todayObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayObj.getMonth() + 1);
  const [selected,  setSelected]  = useState<Set<DateStr>>(new Set(currentDates));
  const [expDates,  setExpDates]  = useState<Set<DateStr>>(new Set());
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchExperimentDates(viewYear, viewMonth)
      .then((r) => setExpDates(new Set(r.dates)))
      .catch(() => setExpDates(new Set()));
  }, [viewYear, viewMonth]);

  const toggleDate = useCallback((d: DateStr) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }, []);

  async function handleSave() {
    if (selected.size === 0) { setError("至少需要选择 1 个日期"); return; }
    setSaving(true);
    setError(null);
    try {
      const sorted = [...selected].sort();
      await saveReportDates(reportId, sorted);
      onSaved(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
    }
  }

  const sortedSelected = [...selected].sort();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">修改已选日期</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <MiniCalendarControlled
            selectedDates={selected}
            onToggle={toggleDate}
            experimentDates={expDates}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onViewChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
          />

          {sortedSelected.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-3">
              {sortedSelected.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDate(d)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium hover:bg-violet-200 transition-colors"
                >
                  {fmtDate(d)}
                  <span className="text-violet-400">×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 mt-3">
              请至少选择 1 个日期
            </p>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <p className="text-xs text-gray-400">蓝紫色圆点 = 有实验记录的日期</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中…" : "保存日期"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
