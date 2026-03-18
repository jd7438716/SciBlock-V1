/**
 * ReportCard — 单份周报展示卡片
 *
 * 标题行：周次标签 | 标题（点击展开内容）| 展开指示
 * 属性行：提交日期 pill
 * 展开区：周报正文
 *
 * Layer: detail sub-component
 */

import { useState } from "react";
import type { WeeklyReport } from "../../../types/team";
import { AttrPill } from "../../../components/team/AttrPill";
import { fmtDate } from "../../../types/weeklyReport";

export interface ReportCardProps {
  report: WeeklyReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const weekLabel = (() => {
    const d = new Date(report.weekStart + "T00:00:00");
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} 周`;
  })();

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm group">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Week tag */}
        <span className="flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap bg-gray-100 text-gray-500 border-gray-200">
          {weekLabel}
        </span>

        {/* Title */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
        >
          {report.title}
        </button>

        {/* Expand indicator */}
        <span className="flex-shrink-0 text-xs text-gray-300 group-hover:text-gray-500 transition-colors">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Attribute pills */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        <AttrPill
          label="周期"
          value={`${fmtDate(report.weekStart)} - ${report.weekEnd ? fmtDate(report.weekEnd) : "?"}`}
        />
        {report.submittedAt && (
          <AttrPill
            label="提交"
            value={new Date(report.submittedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
          />
        )}
      </div>

      {/* Expanded content */}
      {expanded && report.content && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/40 rounded-b-lg">
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
            {report.content}
          </p>
        </div>
      )}
    </div>
  );
}
