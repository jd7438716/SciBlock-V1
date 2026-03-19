/**
 * TeamReportDetailPanel
 *
 * Instructor-facing detail panel for a single student's weekly report.
 * This component is a thin layout layer:
 *  - Renders the report content (AI or manual)
 *  - Delegates review actions to <ReportReviewActions>
 *  - Delegates comment thread to <CommentThread>
 *
 * No business logic here — all data flow is through props.
 */

import React, { useState, useEffect } from "react";
import { Sparkles, CalendarDays, FlaskConical } from "lucide-react";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import { ReportContentView } from "@/components/reports/ReportContentView";
import { CommentThread } from "@/components/reports/CommentThread";
import { ReportReviewActions } from "@/components/reports/ReportReviewActions";
import { useCurrentUser } from "@/contexts/UserContext";
import type { StudentWithReport } from "@/hooks/reports/useTeamReports";
import type { ReviewAction, LinkedExperiment } from "@/types/weeklyReport";
import { parseReportContent, parseAiContent, fmtWeekRange, fmtWeekLabel } from "@/types/weeklyReport";
import { fetchReportDates, fetchReportLinks } from "@/api/weeklyReport";

function fmtDateCN(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface Props {
  selected: StudentWithReport | null;
  weekStart: string;
  weekEnd: string;
  onReview: (
    reportId: string,
    action: ReviewAction,
    reviewerName: string,
    feedbackText?: string,
  ) => Promise<void>;
}

export function TeamReportDetailPanel({ selected, weekStart, weekEnd, onReview }: Props) {
  const { currentUser } = useCurrentUser();
  const currentUserName = currentUser?.name ?? "";
  const currentUserId = currentUser?.id ?? "";

  const report = selected?.report ?? null;
  const isNewModel = !!report?.datesLastSavedAt;

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [linkedExperiments, setLinkedExperiments] = useState<LinkedExperiment[]>([]);

  useEffect(() => {
    if (!report || !isNewModel) {
      setSelectedDates([]);
      setLinkedExperiments([]);
      return;
    }
    fetchReportDates(report.id)
      .then((r) => setSelectedDates(r.dates))
      .catch(() => setSelectedDates([]));
    fetchReportLinks(report.id)
      .then((r) => setLinkedExperiments(r.experiments))
      .catch(() => setLinkedExperiments([]));
  }, [report?.id, isNewModel]);

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
        <p className="text-sm">从左侧选择学生</p>
      </div>
    );
  }

  if (!report) {
    const last = selected.lastSubmission;
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-sm">
          <p className="text-sm text-gray-500 font-medium">
            {selected.name} 本周（{fmtWeekRange(weekStart, weekEnd)}）尚未提交周报
          </p>
          {last ? (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-700">
                最近一次提交：
                <span className="font-medium">{fmtWeekLabel(last.weekStart)}</span>
                {last.weekEnd ? `（${fmtWeekRange(last.weekStart, last.weekEnd)}）` : ""}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1">该同学尚无任何已提交的周报</p>
          )}
        </div>
      </div>
    );
  }

  const handleReview = (action: ReviewAction, feedbackText?: string) =>
    onReview(report.id, action, currentUserName, feedbackText);

  const aiContent = parseAiContent(report);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {selected.name} · {fmtWeekRange(report.weekStart, report.weekEnd)}
            </p>
          </div>
          <ReportStatusTag status={report.status} size="md" />
        </div>

        {/* Report content — AI-generated or manual */}
        {aiContent ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={13} className="text-violet-500" />
              <span className="text-xs font-medium text-violet-600">自动汇总</span>
            </div>
            {aiContent.summary && (
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{aiContent.summary}</p>
            )}
            {aiContent.statusDistribution && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(aiContent.statusDistribution).map(([status, count]) =>
                  count > 0 ? (
                    <span
                      key={status}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {status} ×{count}
                    </span>
                  ) : null,
                )}
              </div>
            )}
            {aiContent.projectSummary && aiContent.projectSummary.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {aiContent.projectSummary.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{p.sciNoteTitle}：</span>
                    {p.experimentCount} 条实验
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-5">
            <ReportContentView content={parseReportContent(report)} />
          </div>
        )}

        {/* Selected dates + linked experiments (new multi-date model only) */}
        {isNewModel && (
          <>
            {selectedDates.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={14} className="text-violet-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">已选日期</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((d) => (
                    <span
                      key={d}
                      className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium"
                    >
                      {fmtDateCN(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">关联实验记录</span>
                <span className="ml-auto text-xs text-gray-400">{linkedExperiments.length} 条</span>
              </div>
              {linkedExperiments.length === 0 ? (
                <p className="text-xs text-gray-400">本周报未关联任何实验记录</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {linkedExperiments.map((exp) => (
                    <li key={exp.id} className="py-2 first:pt-0 last:pb-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{exp.title}</p>
                      <p className="text-xs text-gray-400 truncate">{exp.sciNoteTitle} · {exp.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Review actions panel */}
        <ReportReviewActions report={report} onReview={handleReview} />

        {/* Comment thread */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <CommentThread
            reportId={report.id}
            author={{ id: currentUserId, name: currentUserName, role: "instructor" }}
            readOnly={false}
          />
        </div>
      </div>
    </div>
  );
}
