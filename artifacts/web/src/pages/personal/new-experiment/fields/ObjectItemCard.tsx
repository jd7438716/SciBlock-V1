import React from "react";
import { X, Tag as TagIcon } from "lucide-react";
import type { ObjectItem } from "@/types/experimentFields";
import { AttributeTagRow } from "@/pages/personal/workbench/modules/shared/AttributeTagRow";

interface Props {
  item: ObjectItem;
  onChange: (updated: ObjectItem) => void;
  onDelete: () => void;
}

/**
 * ObjectItemCard — represents a single named entity with attribute tags.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────┐
 *   │ [name input — borderless, semibold]     [× del] │
 *   │ ◇ 属性标签                                      │
 *   │ [tag1] [tag2] … [+ 标签]                        │
 *   └────────────────────────────────────────────────┘
 *
 * Tag strip uses the shared AttributeTagRow (same as all workbench module
 * editors) so the add / edit / delete interaction is identical everywhere.
 */
export function ObjectItemCard({ item, onChange, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-4 pt-3 pb-3 flex flex-col gap-2.5">
      {/* Name row */}
      <div className="flex items-start gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="对象名称…"
          className="flex-1 text-base font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 leading-tight"
        />
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
          title="删除该项"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tags section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <TagIcon size={11} />
          <span>属性标签</span>
        </div>

        <AttributeTagRow
          tags={item.tags}
          onChange={(tags) => onChange({ ...item, tags })}
        />
      </div>
    </div>
  );
}
