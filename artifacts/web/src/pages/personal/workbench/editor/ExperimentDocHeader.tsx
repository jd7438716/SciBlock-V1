/**
 * ExperimentDocHeader — read-only experiment metadata summary.
 *
 * Layer: UI component (reads WorkbenchContext, no mutations).
 *
 * Shown at the top of EditorPanel to give the user orientation without
 * requiring them to look at the left-panel ExperimentHeader for basic info.
 *
 * Displays:
 *   - Experiment title (truncated, full title on hover)
 *   - ExperimentType badge  (from parent SciNote)
 *   - ExperimentStatus badge
 *   - ExperimentCode (mono)
 *   - Objective (clamped to 2 lines)
 *   - Tags (chips)
 *
 * Editing is intentionally NOT available here — the canonical edit controls
 * live in ExperimentHeader (left panel). This keeps mutation logic in one place.
 */

import React from "react";
import { FlaskConical } from "lucide-react";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import type { ExperimentStatus } from "@/types/workbench";

// ---------------------------------------------------------------------------
// Status color map
// ---------------------------------------------------------------------------

const STATUS_CLS: Record<ExperimentStatus, string> = {
  探索中: "bg-blue-50   text-blue-700   border-blue-200",
  可复现: "bg-green-50  text-green-700  border-green-200",
  失败:   "bg-red-50    text-red-700    border-red-200",
  已验证: "bg-violet-50 text-violet-700 border-violet-200",
};

// ---------------------------------------------------------------------------
// ExperimentDocHeader
// ---------------------------------------------------------------------------

export function ExperimentDocHeader() {
  const { currentRecord, experimentType, objective } = useWorkbench();

  return (
    <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100 bg-white">

      {/* Title */}
      <h2
        className="text-base font-semibold text-gray-900 leading-tight truncate"
        title={currentRecord.title}
      >
        {currentRecord.title
          ? currentRecord.title
          : <span className="text-gray-300 font-normal italic">未命名实验</span>}
      </h2>

      {/* Meta row: type · status · code */}
      <div className="flex items-center flex-wrap gap-2 mt-2">
        {experimentType && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 leading-none">
            <FlaskConical size={10} />
            {experimentType}
          </span>
        )}

        <span
          className={[
            "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border leading-none",
            STATUS_CLS[currentRecord.experimentStatus],
          ].join(" ")}
        >
          {currentRecord.experimentStatus}
        </span>

        {currentRecord.experimentCode && (
          <span className="text-xs text-gray-400 font-mono">
            {currentRecord.experimentCode}
          </span>
        )}
      </div>

      {/* Objective */}
      {objective && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
          <span className="text-gray-400">目标：</span>
          {objective}
        </p>
      )}

      {/* Tags */}
      {currentRecord.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {currentRecord.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
