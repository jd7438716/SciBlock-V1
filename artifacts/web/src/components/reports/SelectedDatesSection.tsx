/**
 * SelectedDatesSection — displays the saved dates of a report with an optional
 * "修改日期" button for editable reports.
 *
 * Layer: business component (fetches dates, conditionally opens DateEditModal)
 *
 * Rendered only for new-model reports (datesLastSavedAt IS NOT NULL).
 * The parent decides whether to render this component at all.
 */

import React, { useState, useEffect } from "react";
import { Calendar, Pencil, Loader2 } from "lucide-react";
import { DateEditModal } from "./DateEditModal";
import { fetchReportDates } from "@/api/weeklyReport";
import { fmtDate } from "@/types/weeklyReport";

interface SelectedDatesSectionProps {
  reportId: string;
  isEditable: boolean;
  onDatesChanged?: (dates: string[]) => void;
}

export function SelectedDatesSection({
  reportId,
  isEditable,
  onDatesChanged,
}: SelectedDatesSectionProps) {
  const [dates,     setDates]     = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReportDates(reportId)
      .then((r) => { if (!cancelled) { setDates(r.dates); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId]);

  const handleSaved = (newDates: string[]) => {
    setDates(newDates);
    setModalOpen(false);
    onDatesChanged?.(newDates);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-800">已选日期</h3>
          {!loading && (
            <span className="text-xs text-gray-400">
              {dates.length > 0 ? `${dates.length} 个日期` : "未选择"}
            </span>
          )}
        </div>
        {isEditable && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
          >
            <Pencil size={12} />
            修改日期
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <Loader2 size={12} className="animate-spin" />
          加载中…
        </div>
      ) : dates.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">
          {isEditable ? "点击「修改日期」添加日期" : "暂无已选日期"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d) => (
            <span
              key={d}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium"
            >
              {fmtDate(d)}
            </span>
          ))}
        </div>
      )}

      {modalOpen && (
        <DateEditModal
          reportId={reportId}
          currentDates={dates}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
