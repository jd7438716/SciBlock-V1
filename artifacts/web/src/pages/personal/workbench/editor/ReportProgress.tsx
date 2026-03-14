/**
 * ReportProgress — shows which modules are confirmed while report is not yet ready.
 *
 * Layer: Component (pure UI, no business logic).
 *
 * Renders:
 *   - A progress bar (N / 5 confirmed)
 *   - A checklist of the 5 module names
 *   - A manual "立即生成" button when all confirmed but generation hasn't started
 */

import React from "react";
import { ALL_MODULE_KEYS } from "@/types/workbench";
import type { OntologyModuleKey } from "@/types/workbench";
import type { ReportStatus } from "@/types/report";

const MODULE_LABELS: Record<OntologyModuleKey, string> = {
  system:      "实验系统",
  preparation: "实验准备",
  operation:   "实验操作",
  measurement: "测量过程",
  data:        "实验数据",
};

interface Props {
  confirmedKeys: OntologyModuleKey[];
  status: ReportStatus;
  onGenerate: () => void;
}

export function ReportProgress({ confirmedKeys, status, onGenerate }: Props) {
  const total = ALL_MODULE_KEYS.length;
  const done  = confirmedKeys.length;
  const pct   = Math.round((done / total) * 100);
  const allConfirmed = done === total;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>模块确认进度</span>
          <span>{done} / {total}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="flex flex-col gap-1">
        {ALL_MODULE_KEYS.map((key) => {
          const confirmed = confirmedKeys.includes(key);
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              {confirmed ? (
                <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-bold flex-shrink-0">✓</span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
              )}
              <span className={confirmed ? "text-gray-700" : "text-gray-400"}>
                {MODULE_LABELS[key]}
              </span>
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      {allConfirmed && status === "idle" && (
        <button
          onClick={onGenerate}
          className="mt-1 w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          立即生成实验报告
        </button>
      )}

      {!allConfirmed && (
        <p className="text-xs text-gray-400 text-center">
          确认全部模块后将自动生成报告
        </p>
      )}
    </div>
  );
}
