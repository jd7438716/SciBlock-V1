import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import type { WeeklyReport } from "@/types/weeklyReport";
import { fmtDate, isAiGenerated } from "@/types/weeklyReport";

interface Props {
  reports: WeeklyReport[];
  selectedId: string | null;
  onSelect: (report: WeeklyReport) => void;
  onNew: () => void;
  onAiGenerate: () => void;
  loading: boolean;
}

export function ReportListPanel({ reports, selectedId, onSelect, onNew, onAiGenerate, loading }: Props) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">周报列表</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onAiGenerate}
            title="自动汇总"
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors rounded px-1.5 py-1 hover:bg-violet-50"
          >
            <Sparkles size={12} />
            汇总
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors rounded px-1.5 py-1 hover:bg-gray-100"
          >
            <Plus size={13} />
            新建
          </button>
        </div>
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
            <button
              onClick={onNew}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              手动新建周报
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
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-gray-500">
                        {fmtDate(r.weekStart)} – {r.weekEnd ? fmtDate(r.weekEnd) : "?"}
                      </span>
                      {aiGen && (
                        <Sparkles size={10} className="text-violet-400 flex-shrink-0" />
                      )}
                    </div>
                    <ReportStatusTag status={r.status} />
                  </div>
                  <p className={`text-sm truncate ${active ? "text-blue-900 font-medium" : "text-gray-800"}`}>
                    {r.title}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
