import React from "react";
import { EXPERIMENT_STATUS_OPTIONS } from "@/types/workbench";
import type { ExperimentStatus } from "@/types/workbench";

// ---------------------------------------------------------------------------
// Color map — subdued palette matching the app's monochrome tone
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<ExperimentStatus, string> = {
  探索中: "bg-blue-50 text-blue-700 border-blue-200",
  可复现: "bg-emerald-50 text-emerald-700 border-emerald-200",
  失败:   "bg-red-50 text-red-600 border-red-200",
  已验证: "bg-violet-50 text-violet-700 border-violet-200",
};

interface Props {
  value: ExperimentStatus;
  onChange: (status: ExperimentStatus) => void;
}

/**
 * StatusPicker — a styled badge-style selector for experiment status.
 *
 * Renders the current status as a colored inline badge.
 * Wraps a native <select> invisibly on top for accessible interaction.
 */
export function StatusPicker({ value, onChange }: Props) {
  const colorClass = STATUS_STYLES[value];

  return (
    <div className="relative inline-flex">
      {/* Visible badge layer */}
      <span
        className={[
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
          "pointer-events-none select-none",
          colorClass,
        ].join(" ")}
      >
        {value}
      </span>

      {/* Transparent native select overlaid for interaction */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ExperimentStatus)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
        aria-label="实验状态"
      >
        {EXPERIMENT_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
