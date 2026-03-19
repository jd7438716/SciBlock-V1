/**
 * ReportCard — 单份周报展示卡片
 *
 * 标题行：周次标签 | 标题（点击展开内容）| 展开指示
 * 属性行：提交日期 pill
 * 展开区：周报正文 + 关联实验记录（只读）
 *
 * Layer: detail sub-component
 */

import { useState, useEffect } from "react";
import type { WeeklyReport } from "../../../types/team";
import { AttrPill } from "../../../components/team/AttrPill";
import { FlaskConical, Link2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { fetchReportLinks } from "../../../api/weeklyReport";
import type { LinkedExperiment } from "../../../types/weeklyReport";
import { EXP_STATUS_COLORS } from "../../../types/weeklyReport";

export interface ReportCardProps {
  report: WeeklyReport;
}

// ---------------------------------------------------------------------------
// LinkedExperimentsView — read-only view of linked experiments (instructor)
// ---------------------------------------------------------------------------

function LinkedExperimentsView({ reportId }: { reportId: string }) {
  const [linked, setLinked] = useState<LinkedExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionOpen, setSectionOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchReportLinks(reportId)
      .then((res) => { if (!cancelled) { setLinked(res.experiments); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        <Loader2 size={11} className="animate-spin" />
        加载关联实验…
      </div>
    );
  }

  if (linked.length === 0) return null;

  return (
    <div className="mt-3 border border-violet-100 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-violet-50 hover:bg-violet-100 transition-colors text-left"
        onClick={() => setSectionOpen((o) => !o)}
      >
        <Link2 size={12} className="text-violet-500 shrink-0" />
        <span className="text-xs font-medium text-violet-700 flex-1">
          关联实验记录 · {linked.length} 条
        </span>
        {sectionOpen ? (
          <ChevronDown size={13} className="text-violet-400" />
        ) : (
          <ChevronRight size={13} className="text-violet-400" />
        )}
      </button>

      {sectionOpen && (
        <div className="divide-y divide-gray-50 bg-white">
          {linked.map((e) => (
            <div key={e.id} className="flex items-start gap-2.5 px-3 py-2.5">
              <FlaskConical size={13} className="text-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 leading-snug">{e.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{e.sciNoteTitle}</p>
                {e.purposeInput && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {e.purposeInput}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                  EXP_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportCard (main)
// ---------------------------------------------------------------------------

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
          label="提交"
          value={new Date(report.submittedAt).toLocaleDateString("zh-CN")}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/40 rounded-b-lg">
          {report.content && (
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-2">
              {report.content}
            </p>
          )}
          <LinkedExperimentsView reportId={report.id} />
        </div>
      )}
    </div>
  );
}
