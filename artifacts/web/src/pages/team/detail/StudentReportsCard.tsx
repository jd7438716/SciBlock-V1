/**
 * StudentReportsCard — 导师在成员详情页查看该学生周报列表的入口卡片。
 *
 * Layer: detail card component (data-aware).
 *
 * 职责：
 *  - 通过 useStudentReports 加载指定学生的全部已提交周报
 *  - 渲染可选中的周报行列表，默认展示前 5 条
 *  - 将选中/取消选中事件通过 onSelectReport 向上传递
 *
 * 设计约束：
 *  - 仅供导师使用（只读，无提交/编辑功能）
 *  - 学生自己的可编辑视图由 WeeklyReportsCard 负责（不在本文件中）
 *  - 本组件不知道右侧面板的存在，只通过回调传递选中状态
 */

import { useState, useEffect } from "react";
import { ScrollText, Sparkles } from "lucide-react";
import { useStudentReports } from "@/hooks/team/useStudentReports";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import { fmtWeekRange, fmtWeekLabel } from "@/types/weeklyReport";
import type { WeeklyReport } from "@/types/weeklyReport";

const INITIAL_LIMIT = 5;

// ---------------------------------------------------------------------------
// ReportRow — single report entry in the list
// ---------------------------------------------------------------------------

interface ReportRowProps {
  report:     WeeklyReport;
  isSelected: boolean;
  onClick:    () => void;
}

function ReportRow({ report, isSelected, onClick }: ReportRowProps) {
  const weekLabel    = fmtWeekLabel(report.weekStart);
  const weekRange    = fmtWeekRange(report.weekStart, report.weekEnd);
  const isAiReport   = Boolean(report.aiContentJson);

  return (
    <div
      className={[
        "border rounded-xl shadow-sm transition-colors",
        isSelected
          ? "bg-gray-900 border-gray-900"
          : "bg-white border-gray-100 hover:border-gray-200",
      ].join(" ")}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Status tag — slightly muted when selected */}
        <span className={isSelected ? "opacity-70" : ""}>
          <ReportStatusTag status={report.status} size="sm" />
        </span>

        {/* Title / click target */}
        <button
          onClick={onClick}
          className={[
            "flex-1 text-sm font-medium text-left leading-snug min-w-0 truncate transition-colors",
            isSelected
              ? "text-white"
              : "text-gray-800 hover:text-blue-700",
          ].join(" ")}
          title={isSelected ? "点击收起" : "点击查看周报详情"}
        >
          {report.title}
        </button>

        {/* AI badge */}
        {isAiReport && (
          <span
            className={[
              "flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
              isSelected
                ? "bg-white/10 text-white/70"
                : "bg-violet-50 text-violet-600 border border-violet-200",
            ].join(" ")}
          >
            <Sparkles size={9} />
            自动汇总
          </span>
        )}

        {/* Toggle arrow */}
        <span
          className={[
            "flex-shrink-0 text-sm transition-colors",
            isSelected ? "text-white/60" : "text-gray-300 hover:text-gray-500",
          ].join(" ")}
        >
          {isSelected ? "✕" : "›"}
        </span>
      </div>

      {/* Date pills — only in unselected state */}
      {!isSelected && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
            <span className="text-xs text-slate-500">
              {weekLabel} · {weekRange}
            </span>
          </span>

          {report.submittedAt && (
            <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
              <span className="text-xs text-slate-500">
                提交: {new Date(report.submittedAt).toLocaleDateString("zh-CN")}
              </span>
            </span>
          )}

          {report.reviewedAt && (
            <span className="inline-flex items-center bg-green-50 rounded-full px-2.5 py-0.5">
              <span className="text-xs text-green-600">
                批阅: {new Date(report.reviewedAt).toLocaleDateString("zh-CN")}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudentReportsCard — main export
// ---------------------------------------------------------------------------

interface Props {
  studentId:        string;
  selectedReportId: string | null;
  /** Called when user selects or deselects (null) a report. */
  onSelectReport:   (report: WeeklyReport | null) => void;
  /** Bubbles total count up to the section heading. */
  onCountChange?:   (count: number) => void;
}

export function StudentReportsCard({
  studentId,
  selectedReportId,
  onSelectReport,
  onCountChange,
}: Props) {
  const { reports, loading, error } = useStudentReports(studentId);
  const [showAll, setShowAll] = useState(false);

  // Notify parent of count changes so SectionHeading can display it
  useEffect(() => {
    onCountChange?.(reports.length);
  }, [reports.length, onCountChange]);

  // Toggle selection: re-clicking the same row deselects it
  function handleRowClick(report: WeeklyReport) {
    onSelectReport(selectedReportId === report.id ? null : report);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        <span className="text-xs text-gray-400">加载中…</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return <p className="text-xs text-red-400 py-4 text-center">{error}</p>;
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 border border-dashed border-gray-200 rounded-lg">
        <ScrollText size={20} className="text-gray-200" />
        <p className="text-xs text-gray-400">该成员暂无已提交的周报</p>
      </div>
    );
  }

  const visible = showAll ? reports : reports.slice(0, INITIAL_LIMIT);

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {visible.map((r) => (
          <ReportRow
            key={r.id}
            report={r}
            isSelected={r.id === selectedReportId}
            onClick={() => handleRowClick(r)}
          />
        ))}
      </div>

      {reports.length > INITIAL_LIMIT && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 w-full inline-flex items-center justify-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full py-1 transition-colors"
        >
          {showAll ? "收起" : `查看全部 ${reports.length} 份`}
        </button>
      )}
    </div>
  );
}
