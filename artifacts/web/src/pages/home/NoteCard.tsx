import React from "react";
import { Clock } from "lucide-react";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface Props {
  item: RecentExperimentItem;
  onClick: (id: string) => void;
}

/**
 * NoteCard — one card in the "最近实验" grid on the home page.
 *
 * The entire card surface is clickable (role="button").
 * Only renders title + optional subtitle + relative time — no extra badges.
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
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <p className="text-sm font-medium text-gray-800 mb-1 leading-snug line-clamp-2">
        {item.title}
      </p>
      {item.subtitle && (
        <p className="text-xs text-gray-400 mb-2 truncate">{item.subtitle}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        <Clock size={11} />
        <span>{item.ago}</span>
      </div>
    </div>
  );
}
