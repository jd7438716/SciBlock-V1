import React from "react";
import { Clock } from "lucide-react";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface Props {
  item: RecentExperimentItem;
  onClick: (id: string) => void;
}

/**
 * NoteCard — one card in the "最近项目" grid on the home page.
 *
 * Each card represents a SciNote (top-level research project), NOT an
 * individual experiment record. There is no parent entity above SciNote,
 * so no "所属项目" field exists or is fabricated.
 *
 * Information hierarchy:
 *   1. Project title     (SciNote.title)
 *   2. Experiment type   (SciNote.experimentType, shown as a category tag)
 *   3. Last active time  (effectiveTime = updatedAt ?? createdAt)
 */
export function NoteCard({ item, onClick }: Props) {
  function handleClick() {
    onClick(item.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(item.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex flex-col gap-2"
    >
      {/* Project title */}
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
        {item.title}
      </p>

      {/* Experiment type — category tag, not "所属项目" */}
      {item.subtitle ? (
        <span className="self-start inline-block bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 truncate max-w-full">
          {item.subtitle}
        </span>
      ) : (
        <span className="self-start inline-block bg-gray-50 text-gray-300 text-xs rounded-full px-2 py-0.5">
          未分类
        </span>
      )}

      {/* Last active time */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-auto pt-1">
        <Clock size={11} className="flex-shrink-0" />
        <span>{item.ago}</span>
      </div>
    </div>
  );
}
