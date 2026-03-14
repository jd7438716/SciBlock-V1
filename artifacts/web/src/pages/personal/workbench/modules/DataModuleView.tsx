import React from "react";
import { Plus } from "lucide-react";
import type { DataItem } from "@/types/ontologyModules";

interface Props {
  items: DataItem[];
  onAdd: () => void;
}

/**
 * DataModuleView — row-list layout for the 实验数据 module.
 *
 * Each row shows: data name, unit chip, description.
 * No complex tables or charts in this phase — data items only.
 */
export function DataModuleView({ items, onAdd }: Props) {
  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      {/* Section label */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
        数据项
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm"
        >
          {/* Name + unit */}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
              {item.unit && (
                <span className="text-[11px] font-mono bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 border border-gray-200">
                  {item.unit}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>
      ))}

      {/* Add entry */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 hover:text-gray-500 transition-colors w-full justify-center mt-1"
      >
        <Plus size={12} />
        新增数据项
      </button>
    </div>
  );
}
