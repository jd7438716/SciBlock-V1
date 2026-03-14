import React from "react";
import { Plus } from "lucide-react";
import type { OperationStep } from "@/types/ontologyModules";
import { AttributeTagRow } from "./shared/AttributeTagRow";

interface Props {
  steps: OperationStep[];
  onAdd: () => void;
}

/**
 * OperationModuleView — numbered-step layout for the 实验操作 module.
 *
 * Each step shows: step number circle, name, params (monospace), optional notes.
 */
export function OperationModuleView({ steps, onAdd }: Props) {
  return (
    <div className="px-4 py-3 flex flex-col gap-0">
      {/* Section label */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
        操作步骤
      </p>

      {/* Step list — connected by a left-side line */}
      <div className="relative flex flex-col gap-0">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.id} className="flex gap-3">
              {/* Step number + connector line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {step.order}
                </div>
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>

              {/* Step content */}
              <div className={["flex flex-col gap-0.5 pb-4 min-w-0", isLast ? "pb-0" : ""].join(" ")}>
                <span className="text-sm font-medium text-gray-800 leading-snug">
                  {step.name}
                </span>
                {(step.params?.length ?? 0) > 0 && (
                  <AttributeTagRow tags={step.params ?? []} onChange={() => {}} />
                )}
                {step.notes && (
                  <p className="text-xs text-gray-400 leading-relaxed">{step.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add entry */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 hover:text-gray-500 transition-colors w-full justify-center mt-3"
      >
        <Plus size={12} />
        新增步骤
      </button>
    </div>
  );
}
