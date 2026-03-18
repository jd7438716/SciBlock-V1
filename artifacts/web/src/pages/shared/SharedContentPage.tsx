/**
 * SharedContentPage — 分享内容只读浏览页
 *
 * Layer: page
 *
 * 路由: /shared/:shareId
 *
 * 职责:
 *   1. 通过 shareId 验证当前用户是合法接收方。
 *   2. 根据 resourceType 拉取对应内容数据。
 *   3. 以只读模式展示内容，附带"来源"提示条。
 *
 * 不挂载 AppLayout 的侧边栏 — 只读浏览场景下不需要全局导航。
 * 提供"返回"链接回到消息页。
 */

import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Lock, AlertCircle, FlaskConical, FileText } from "lucide-react";
import { fetchShare } from "@/api/shares";
import { getExperiment } from "@/api/experiments";
import { fetchReport } from "@/api/weeklyReport";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import {
  SummaryCard,
  StatusCard,
  ProjectSummaryCard,
  OperationCard,
  TrendsCard,
  ParamCard,
  ProvenanceCard,
} from "@/components/reports/AiReportSections";
import { parseAiContent, fmtDate } from "@/types/weeklyReport";
import type { Share } from "@/types/share";
import type { ExperimentRecord } from "@/types/workbench";
import type { WeeklyReport, AiReportContent } from "@/types/weeklyReport";

// ---------------------------------------------------------------------------
// Status display for experiment records
// ---------------------------------------------------------------------------

const EXP_STATUS_LABELS: Record<string, string> = {
  exploring:   "探索中",
  in_progress: "进行中",
  completed:   "已完成",
  paused:      "已暂停",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-100 rounded w-2/3" />
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="h-40 bg-gray-50 rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <AlertCircle size={28} className="text-red-400" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <Link
        href="/home/messages"
        className="text-xs text-indigo-600 hover:underline"
      >
        返回消息页
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share context banner
// ---------------------------------------------------------------------------

function SharedFromBanner({ share }: { share: Share }) {
  const isRecipient = true; // only recipients reach this page
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-700">
      <Lock size={12} className="flex-shrink-0" />
      <span>
        <span className="font-semibold">{share.resourceTitle}</span>
        {" "}由{" "}
        <span className="font-semibold">他人</span>
        {" "}分享给你 · 只读模式
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Experiment record view (read-only)
// ---------------------------------------------------------------------------

function ExperimentView({ experiment }: { experiment: ExperimentRecord }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
          <FlaskConical size={20} className="text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{experiment.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {EXP_STATUS_LABELS[experiment.experimentStatus] ?? experiment.experimentStatus}
            </span>
            {experiment.experimentCode && (
              <span className="text-xs text-gray-400 font-mono">{experiment.experimentCode}</span>
            )}
            {experiment.tags?.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Purpose */}
      {experiment.purposeInput && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">实验目的</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {experiment.purposeInput}
          </p>
        </div>
      )}

      {/* Editor content */}
      {experiment.editorContent && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">实验内容</p>
          <div
            className="prose prose-sm max-w-none text-gray-800 [&_h1]:text-base [&_h2]:text-sm [&_p]:leading-relaxed [&_ul]:list-disc [&_ol]:list-decimal"
            dangerouslySetInnerHTML={{ __html: experiment.editorContent }}
          />
        </div>
      )}

      {!experiment.purposeInput && !experiment.editorContent && (
        <p className="text-sm text-gray-400 text-center py-8">该实验记录暂无内容。</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly report view (read-only)
// ---------------------------------------------------------------------------

function ReportView({ report }: { report: WeeklyReport }) {
  const aiContent: AiReportContent | null = parseAiContent(report);

  const dateLabel =
    report.dateRangeStart && report.dateRangeEnd
      ? `${fmtDate(report.dateRangeStart)} – ${fmtDate(report.dateRangeEnd)}`
      : report.weekStart
        ? fmtDate(report.weekStart)
        : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{report.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <ReportStatusTag status={report.status} />
            {dateLabel && <span className="text-xs text-gray-400">{dateLabel}</span>}
          </div>
        </div>
      </div>

      {/* AI content sections */}
      {aiContent ? (
        <div className="space-y-4">
          {aiContent.summary && <SummaryCard content={aiContent} />}
          {aiContent.statusDistribution && <StatusCard content={aiContent} />}
          {aiContent.projectSummary && aiContent.projectSummary.length > 0 && (
            <ProjectSummaryCard content={aiContent} />
          )}
          {aiContent.operationSummary && <OperationCard content={aiContent} />}
          {aiContent.resultTrends && aiContent.resultTrends.length > 0 && (
            <TrendsCard content={aiContent} />
          )}
          {aiContent.parameterChanges && aiContent.parameterChanges.length > 0 && (
            <ParamCard content={aiContent} />
          )}
          {aiContent.provenanceExperiments && aiContent.provenanceExperiments.length > 0 && (
            <ProvenanceCard content={aiContent} />
          )}
        </div>
      ) : report.content ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">周报内容</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.content}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">该周报暂无内容。</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SharedContentPage() {
  const { shareId } = useParams<{ shareId: string }>();

  const [share, setShare] = useState<Share | null>(null);
  const [experiment, setExperiment] = useState<ExperimentRecord | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    setLoading(true);
    setError(null);

    fetchShare(shareId)
      .then(async (res) => {
        const s = res.share;
        setShare(s);

        if (s.resourceType === "experiment_record") {
          const exp = await getExperiment(s.resourceId);
          setExperiment(exp);
        } else if (s.resourceType === "weekly_report") {
          const rpt = await fetchReport(s.resourceId);
          setReport(rpt);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "无法加载分享内容";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
        <Link
          href="/home/messages"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          返回消息
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm font-medium text-gray-700">分享内容</span>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {loading && <Skeleton />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && share && (
          <>
            <SharedFromBanner share={share} />
            {experiment && <ExperimentView experiment={experiment} />}
            {report && <ReportView report={report} />}
          </>
        )}
      </div>
    </div>
  );
}
