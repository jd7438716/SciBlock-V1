import React from "react";
import { Sparkles } from "lucide-react";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import type { WeeklyReport } from "@/types/weeklyReport";
import { fmtDate, fmtWeekLabel, isAiGenerated } from "@/types/weeklyReport";

/** Format a datetime string to a compact locale string (no year). */
function fmtTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  reports: WeeklyReport[];
  selectedId: string | null;
  onSelect: (report: WeeklyReport) => void;
  onAiGenerate: () => void;
  loading: boolean;
}

export function ReportListPanel({ reports, selectedId, onSelect, onAiGenerate, loading }: Props) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">周报列表</span>
        <button
          onClick={onAiGenerate}
          title="自动汇总实验记录，生成周报"
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors rounded px-1.5 py-1 hover:bg-violet-50"
        >
          <Sparkles size={12} />
          汇总
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-gray-400">加载中…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <p className="text-sm text-gray-400">还没有周报</p>
            <button
              onClick={onAiGenerate}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              <Sparkles size={13} />
              自动汇总实验记录
            </button>
          </div>
        ) : (
          <div className="py-1">
            {reports.map((r) => {
              const active = r.id === selectedId;
              const aiGen = isAiGenerated(r);
              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={[
                    "w-full text-left px-4 py-3 border-b border-gray-50 transition-colors",
                    active ? "bg-blue-50" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {/* Row 1: week label + status tag */}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-gray-600">
                        {fmtWeekLabel(r.weekStart)}
                      </span>
                      {aiGen && (
                        <Sparkles size={10} className="text-violet-400 flex-shrink-0" />
                      )}
                    </div>
                    <ReportStatusTag status={r.status} />
                  </div>
                  {/* Row 2: date range */}
                  <p className="text-xs text-gray-400 mb-1">
                    {fmtDate(r.weekStart)} – {r.weekEnd ? fmtDate(r.weekEnd) : "?"}
                  </p>
                  {/* Row 3: title */}
                  <p className={`text-sm truncate ${active ? "text-blue-900 font-medium" : "text-gray-800"}`}>
                    {r.title}
                  </p>
                  {/* Row 4: submitted/updated time */}
                  {(() => {
                    const timeLabel = r.submittedAt
                      ? `提交 ${fmtTime(r.submittedAt)}`
                      : r.updatedAt
                      ? `更新 ${fmtTime(r.updatedAt)}`
                      : null;
                    return timeLabel ? (
                      <p className="text-xs text-gray-400 mt-0.5">{timeLabel}</p>
                    ) : null;
                  })()}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
