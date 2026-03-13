import React from "react";
import { Plus } from "lucide-react";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import type { ExperimentRecord, ExperimentStatus } from "@/types/workbench";

const RECORD_FALLBACK = "未命名实验";

// Minimal colored dot per status — same palette as StatusPicker
const STATUS_DOT: Record<ExperimentStatus, string> = {
  探索中: "bg-blue-400",
  可复现: "bg-emerald-400",
  失败: "bg-red-400",
  已验证: "bg-violet-400",
};

function RecordTab({
  record,
  index,
  isActive,
  onSelect,
}: {
  record: ExperimentRecord;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const label = record.title.trim() || RECORD_FALLBACK;
  const dot = STATUS_DOT[record.experimentStatus];

  return (
    <button
      onClick={onSelect}
      title={label}
      className={[
        "flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap",
        "border-b-2 transition-colors flex-shrink-0 max-w-[160px]",
        isActive
          ? "border-gray-900 text-gray-900 font-medium bg-white"
          : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200 bg-transparent",
      ].join(" ")}
    >
      <span className="text-gray-300 font-mono">{String(index).padStart(2, "0")}</span>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * RecordSwitcher — horizontal tab bar above the three-panel layout.
 *
 * Shows all experiment records for the current SciNote.
 * Clicking a tab switches to that record.
 * "+ 新建记录" appended on the right.
 */
export function RecordSwitcher() {
  const { records, currentRecord, switchRecord, createNewRecord } = useWorkbench();

  return (
    <div className="flex-shrink-0 flex items-center border-b border-gray-100 bg-gray-50 overflow-x-auto">
      {records.map((rec, i) => (
        <RecordTab
          key={rec.id}
          record={rec}
          index={i + 1}
          isActive={rec.id === currentRecord.id}
          onSelect={() => switchRecord(rec.id)}
        />
      ))}

      <button
        onClick={createNewRecord}
        title="新建实验记录"
        className="flex items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 border-b-2 border-transparent"
      >
        <Plus size={12} />
        新建
      </button>
    </div>
  );
}
