import React from "react";
import { ArrowDownFromLine, CheckCircle2 } from "lucide-react";
import type { ExperimentRecord } from "@/types/workbench";

interface Props {
  record: ExperimentRecord;
}

/**
 * InheritanceBanner — a slim read-only banner shown at the top of the ontology
 * panel (below ExperimentHeader) that surfaces the record's lineage.
 *
 * Hidden when:
 *   - The record has a local temp ID (not yet persisted server-side).
 *   - sequenceNumber is 0 or 1 AND derivedFromSourceType is "initial"
 *     AND there is no confirmed ancestor (i.e. the very first record, first time
 *     ever — no meaningful lineage to display).
 *
 * Display rules (first meaningful state wins):
 *   1. derivedFromSourceType === "record"
 *      → "已继承第 N 条确认保存的记录"  (blue)
 *   2. derivedFromSourceType === "initial" AND sequenceNumber > 1
 *      → "已继承实验初始化模块"           (gray)
 *   3. Otherwise → null (first record, first-ever visit)
 */
export function InheritanceBanner({ record }: Props) {
  // Skip for local temp records
  if (!record.id.includes("-") || record.id.startsWith("rec_")) return null;

  const { derivedFromSourceType, derivedFromRecordSeq, sequenceNumber } = record;

  let text: string | null = null;
  let colorClass = "bg-blue-50 text-blue-700 border-blue-100";

  if (derivedFromSourceType === "record" && derivedFromRecordSeq != null) {
    text = `已继承第 ${derivedFromRecordSeq} 条确认保存的记录`;
    colorClass = "bg-blue-50 text-blue-700 border-blue-100";
  } else if (derivedFromSourceType === "initial" && sequenceNumber > 1) {
    text = "已继承实验初始化模块";
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

/**
 * ConfirmationStateBadge — a small inline badge shown next to the confirm button
 * indicating the current confirmation state of the record.
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
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        已修改
      </span>
    );
  }

  return null;
}
