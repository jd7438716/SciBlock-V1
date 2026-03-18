import React from "react";
import { ArrowDownFromLine, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import type { ExperimentRecord } from "@/types/workbench";

interface Props {
  record: ExperimentRecord;
}

// ---------------------------------------------------------------------------
// InheritanceBanner
// ---------------------------------------------------------------------------

/**
 * InheritanceBanner — a slim read-only strip surfacing the record's lineage.
 *
 * Hidden when:
 *   - Record is not yet persisted (local temp ID).
 *   - sequenceNumber is 0 or 1 AND derivedFromSourceType is "initial"
 *     (the very first record on first visit — no meaningful lineage).
 *
 * Display rules (first matching wins):
 *   1. derivedFromSourceType === "record"
 *      → "继承自第 N 次实验记录"      (blue)
 *   2. derivedFromSourceType === "initial" AND sequenceNumber > 1
 *      → "继承自实验初始化内容"        (gray)
 *   3. Otherwise → null
 */
export function InheritanceBanner({ record }: Props) {
  if (!record.id.includes("-") || record.id.startsWith("rec_")) return null;

  const { derivedFromSourceType, derivedFromRecordSeq, sequenceNumber } = record;

  let text: string | null = null;
  let colorClass = "bg-blue-50 text-blue-700 border-blue-100";

  if (derivedFromSourceType === "record" && derivedFromRecordSeq != null) {
    text = `继承自第 ${derivedFromRecordSeq} 次实验记录`;
    colorClass = "bg-blue-50 text-blue-700 border-blue-100";
  } else if (derivedFromSourceType === "initial" && sequenceNumber > 1) {
    text = "继承自实验初始化内容";
    colorClass = "bg-gray-50 text-gray-500 border-gray-100";
  }

  if (!text) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-4 py-1.5 border-b text-xs font-medium ${colorClass}`}
    >
      <ArrowDownFromLine size={11} className="flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DirtyWarningBanner
// ---------------------------------------------------------------------------

interface DirtyWarningBannerProps {
  /** Whether a confirm request is in flight. */
  isConfirming: boolean;
  /** Called when the user clicks "立即确认" inside the banner. */
  onConfirm: () => void;
}

/**
 * DirtyWarningBanner — a prominent amber warning strip rendered when a record
 * is in the `confirmed_dirty` state.
 *
 * Responsibility boundary:
 *   - Pure UI component; receives state + callback from ExperimentHeader.
 *   - The actual confirm() side-effect remains in WorkbenchContext.
 *   - No direct context dependency keeps this component reusable and testable.
 */
export function DirtyWarningBanner({ isConfirming, onConfirm }: DirtyWarningBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
      <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
      <span className="text-xs text-amber-800 font-medium flex-1">
        内容已修改，需重新确认才能更新继承链
      </span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isConfirming}
        className={[
          "inline-flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1",
          "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
          "border border-amber-600 transition-colors whitespace-nowrap",
          isConfirming ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {isConfirming ? (
          <Loader2 size={10} className="animate-spin" />
        ) : null}
        {isConfirming ? "确认中…" : "立即确认"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmationStateBadge
// ---------------------------------------------------------------------------

/**
 * ConfirmationStateBadge — a small inline pill shown in the header's status row.
 *
 * confirmed       → green "已确认"
 * confirmed_dirty → amber "已修改"  (supplements the DirtyWarningBanner above)
 * draft           → nothing (button already signals the action)
 */
export function ConfirmationStateBadge({ record }: Props) {
  const { confirmationState } = record;

  if (confirmationState === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 size={10} />
        已确认
      </span>
    );
  }

  if (confirmationState === "confirmed_dirty") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertTriangle size={10} />
        已修改
      </span>
    );
  }

  return null;
}
