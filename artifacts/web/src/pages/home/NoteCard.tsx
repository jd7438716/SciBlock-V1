import React from "react";
import { Clock, FlaskConical } from "lucide-react";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface Props {
  item: RecentExperimentItem;
  onClick: (item: RecentExperimentItem) => void;
}

/**
 * NoteCard — one card in the "最近实验" feed on the home page.
 *
 * Each card represents an Experiment record, with its parent SciNote shown
 * as a secondary label below the experiment title.
 *
 * Information hierarchy:
 *   1. Experiment title  (experimentTitle)
 *   2. Parent project    (sciNoteTitle) — shown as a tag
 *   3. Last active time  (ago = pre-formatted relative label)
 */
export function NoteCard({ item, onClick }: Props) {
  function handleClick() {
    onClick(item);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(item);
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
      {/* Experiment title */}
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
        {item.experimentTitle}
      </p>

      {/* Parent SciNote name */}
      <div className="flex items-center gap-1 min-w-0">
        <FlaskConical size={10} className="flex-shrink-0 text-gray-300" />
        <span className="text-xs text-gray-400 truncate">{item.sciNoteTitle}</span>
      </div>

      {/* Last active time */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-auto pt-1">
        <Clock size={11} className="flex-shrink-0" />
        <span>{item.ago}</span>
      </div>
    </div>
  );
}
