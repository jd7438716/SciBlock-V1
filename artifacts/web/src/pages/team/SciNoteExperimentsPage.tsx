/**
 * SciNoteExperimentsPage — 某项目（SciNote）下全部实验记录列表
 *
 * Route: /home/members/:memberId/scinotes/:sciNoteId/experiments
 *
 * Layer: page
 * Deps: useSciNoteExperiments (hook), useSciNoteStore (title lookup)
 *
 * Navigation chain this page is part of:
 *   MemberDetailPage → [click project name] →
 *   SciNoteExperimentsPage → [click record row] →
 *   /personal/experiment/:sciNoteId/workbench?experimentId=:recordId
 */

import React from "react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, FlaskConical } from "lucide-react";
import { useSciNoteExperiments }  from "@/hooks/team/useSciNoteExperiments";
import { useSciNoteStore }         from "@/contexts/SciNoteStoreContext";
import { STATUS_TEXT_CLASS }       from "@/types/calendarPanel";
import { STATUS_DOT_CLASS }        from "@/types/calendarPanel";
import type { ExperimentRecord, ExperimentStatus } from "@/types/workbench";

// ---------------------------------------------------------------------------
// Single experiment record row
// ---------------------------------------------------------------------------

interface ExperimentRowProps {
  record: ExperimentRecord;
  onOpen: () => void;
}

function ExperimentRow({ record, onOpen }: ExperimentRowProps) {
  const status = record.experimentStatus as ExperimentStatus;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all group px-4 py-3 flex items-start gap-3"
    >
      {/* Status dot */}
      <span
        className={[
          "flex-shrink-0 w-2 h-2 rounded-full mt-1.5",
          STATUS_DOT_CLASS[status] ?? "bg-gray-300",
        ].join(" ")}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-sm font-medium text-gray-800 leading-snug truncate">
          {record.title || "（未命名实验）"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              "text-xs font-medium",
              STATUS_TEXT_CLASS[status] ?? "text-gray-500",
            ].join(" ")}
          >
            {status}
          </span>
          <span className="text-gray-200 text-xs">·</span>
          <time
            dateTime={record.createdAt}
            className="text-xs text-gray-400"
          >
            {new Date(record.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </time>
        </div>
      </div>

      {/* Arrow */}
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-sm mt-0.5 flex-shrink-0">
        ›
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SciNoteExperimentsPage() {
  const { memberId, sciNoteId } = useParams<{
    memberId: string;
    sciNoteId: string;
  }>();
  const [, navigate] = useLocation();

  // Look up SciNote title from the local store (populated on auth).
  // Falls back gracefully if the SciNote isn't in the store yet.
  const { notes } = useSciNoteStore();
  const sciNoteTitle = notes.find((n) => n.id === sciNoteId)?.title ?? "该项目";

  const { experiments, loading, error } = useSciNoteExperiments(sciNoteId ?? "");

  // Sort newest first
  const sorted = [...experiments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function handleOpenRecord(record: ExperimentRecord) {
    navigate(
      `/personal/experiment/${record.sciNoteId}/workbench?experimentId=${record.id}`,
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/70">

      {/* ── 面包屑 ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-2.5">
        <div className="max-w-2xl mx-auto px-6">
          <button
            onClick={() => navigate(`/home/members/${memberId}`)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft
              size={13}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>成员详情</span>
            <span className="text-gray-300 mx-0.5">·</span>
            <span className="text-gray-900 font-medium">{sciNoteTitle}</span>
          </button>
        </div>
      </div>

      {/* ── 内容区 ──────────────────────────────────────────── */}
      <div className="px-6 py-5 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Page header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-gray-400 flex-shrink-0" />
            <h1 className="text-base font-semibold text-gray-800 leading-snug">
              {sciNoteTitle}
            </h1>
          </div>
          <p className="text-xs text-gray-400 pl-5">该项目下的全部实验记录</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-xs text-gray-400">加载中…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-8 border border-dashed border-red-100 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2">
            <FlaskConical size={28} className="text-gray-200" />
            <p className="text-sm text-gray-400">该项目暂无实验记录</p>
          </div>
        )}

        {/* Record list */}
        {!loading && !error && sorted.length > 0 && (
          <>
            <p className="text-xs text-gray-400">
              共 {sorted.length} 条，按创建时间倒序
            </p>
            <div className="flex flex-col gap-1.5">
              {sorted.map((record) => (
                <ExperimentRow
                  key={record.id}
                  record={record}
                  onOpen={() => handleOpenRecord(record)}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
