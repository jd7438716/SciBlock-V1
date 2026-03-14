import React from "react";
import { Plus } from "lucide-react";
import type { PrepItem } from "@/types/ontologyModules";

interface Props {
  items: PrepItem[];
  onAdd: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  基底清洗: "bg-sky-50 text-sky-700 border-sky-200",
  表面活化: "bg-amber-50 text-amber-700 border-amber-200",
  靶材处理: "bg-violet-50 text-violet-700 border-violet-200",
};

/**
 * PreparationModuleView — list-style layout for the 实验准备 module.
 *
 * Each item shows: category badge, name, duration chip, optional description.
 */
export function PreparationModuleView({ items, onAdd }: Props) {
  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      {/* Section label */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
        准备项
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm"
        >
          {/* Category badge */}
          <span
            className={[
              "flex-shrink-0 mt-0.5 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap",
              CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-500 border-gray-200",
            ].join(" ")}
          >
            {item.category}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
              {item.duration && (
                <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {item.duration}
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
        新增准备项
      </button>
    </div>
  );
}
