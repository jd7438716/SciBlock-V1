/**
 * MemberReportDetailPanel — 右侧面板：导师查看某份周报的完整详情。
 *
 * Layer: component (pure UI — no data fetching beyond CommentThread).
 *
 * 使用场景：成员详情页双栏模式的右侧面板，由 MemberDetailPage 控制。
 *
 * 展示内容：
 *  1. 头部：周报标题、状态标签、关闭按钮
 *  2. 报告内容：AI 自动汇总（摘要+实验分布+项目列表）或手动填写内容
 *  3. 批阅状态条：已批阅时间 / 待修改提示
 *  4. 评论区：只读，展示导师与学生之间的历史评论
 *
 * 设计约束：
 *  - 本组件只读，不提供批阅操作（批阅在 /team/reports 页面完成）
 *  - report 数据由父组件传入，本组件不发起任何数据请求（CommentThread 除外）
 *  - 不依赖路由 —— 关闭动作通过 onClose 回调向上传递
 */

import { X, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { CommentThread } from "@/components/reports/CommentThread";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import { ReportContentView } from "@/components/reports/ReportContentView";
import { parseReportContent, parseAiContent, fmtWeekRange, fmtWeekLabel } from "@/types/weeklyReport";
import type { WeeklyReport } from "@/types/weeklyReport";

// ---------------------------------------------------------------------------
// Review status banner
// ---------------------------------------------------------------------------

function ReviewStatusBanner({ report }: { report: WeeklyReport }) {
  if (report.status === "reviewed" && report.reviewedAt) {
    const date = new Date(report.reviewedAt).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-800">已批阅</p>
          <p className="text-xs text-green-600 mt-0.5">批阅时间：{date}</p>
        </div>
      </div>
    );
  }

  if (report.status === "needs_revision") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-medium text-red-700">已要求学生修改</p>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// AI report summary section
// ---------------------------------------------------------------------------

function AiSummarySection({ report }: { report: WeeklyReport }) {
  const aiContent = parseAiContent(report);
  if (!aiContent) return null;

  return (
    <div className="border border-gray-100 rounded-xl bg-white px-4 py-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={13} className="text-violet-500" />
        <span className="text-xs font-medium text-violet-600">自动汇总</span>
      </div>

      {aiContent.summary && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {aiContent.summary}
        </p>
      )}

      {aiContent.statusDistribution && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(aiContent.statusDistribution).map(([key, count]) =>
            typeof count === "number" && count > 0 ? (
              <span
                key={key}
                className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {key} ×{count}
              </span>
            ) : null,
          )}
        </div>
      )}

      {aiContent.projectSummary && aiContent.projectSummary.length > 0 && (
        <ul className="space-y-1.5 border-t border-gray-50 pt-3">
          {aiContent.projectSummary.map((p, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
              <span className="text-gray-300 mt-0.5 flex-shrink-0">·</span>
              <span>
                <span className="font-medium">{p.sciNoteTitle}：</span>
                {p.experimentCount} 条实验
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual report section
// ---------------------------------------------------------------------------

function ManualContentSection({ report }: { report: WeeklyReport }) {
  const content = parseReportContent(report);
  const hasAnyContent = Object.values(content).some((v) => v.trim());

  if (!hasAnyContent) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center">
        <p className="text-xs text-gray-400">该周报暂无结构化内容</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl bg-white px-4 py-4">
      <ReportContentView content={content} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

interface Props {
  report:   WeeklyReport;
  onClose:  () => void;
}

export function MemberReportDetailPanel({ report, onClose }: Props) {
  const isAiReport = Boolean(report.aiContentJson);
  const weekLabel  = fmtWeekLabel(report.weekStart);
  const weekRange  = fmtWeekRange(report.weekStart, report.weekEnd);

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1">
            {weekLabel} · {weekRange}
          </p>
          <h2 className="text-sm font-semibold text-gray-900 leading-snug truncate">
            {report.title}
          </h2>
          <div className="mt-1">
            <ReportStatusTag status={report.status} size="sm" />
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="关闭周报详情"
          className="flex-shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Body — scrollable ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Review status banner (only for reviewed or needs_revision) */}
        <ReviewStatusBanner report={report} />

        {/* Report content: AI or manual */}
        {isAiReport ? (
          <AiSummarySection report={report} />
        ) : (
          <ManualContentSection report={report} />
        )}

        {/* Comment thread — read-only (instructors comment in the reports management page) */}
        <div className="border border-gray-100 rounded-xl bg-white px-4 py-4">
          <CommentThread
            reportId={report.id}
            author={{ id: "", name: "", role: "instructor" }}
            readOnly
          />
        </div>

      </div>
    </div>
  );
}
