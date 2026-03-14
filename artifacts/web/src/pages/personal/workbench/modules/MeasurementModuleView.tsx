import React from "react";
import { Plus } from "lucide-react";
import type { MeasurementItem } from "@/types/ontologyModules";
import { AttributeTagRow } from "./shared/AttributeTagRow";

interface Props {
  items: MeasurementItem[];
  onAdd: () => void;
}

/**
 * MeasurementModuleView — card layout for the 测量过程 module.
 *
 * Each card shows: measurement name, instrument badge, method, target, conditions.
 */
export function MeasurementModuleView({ items, onAdd }: Props) {
  return (
    <div className="px-4 py-3 flex flex-col gap-3">
      {/* Section label */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        测量项
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 flex flex-col gap-2 shadow-sm"
        >
          {/* Name + instrument */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
            {item.instrument && (
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 leading-none">
                {item.instrument}
              </span>
            )}
          </div>

          {/* Target — what this measurement determines */}
          <p className="text-xs text-gray-600 leading-relaxed">{item.target}</p>

          {/* Method row */}
          {item.method && (
            <div className="flex gap-1.5 items-start">
              <span className="text-[10px] font-medium text-gray-400 flex-shrink-0 mt-0.5">
                方法
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 leading-relaxed">
                {item.method}
              </span>
            </div>
          )}

          {/* Conditions — key:value tag chips (read-only in view state) */}
          {(item.conditions?.length ?? 0) > 0 && (
            <AttributeTagRow tags={item.conditions ?? []} onChange={() => {}} />
          )}
        </div>
      ))}

      {/* Add entry */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 hover:text-gray-500 transition-colors w-full justify-center"
      >
        <Plus size={12} />
        新增测量项
      </button>
    </div>
  );
}
