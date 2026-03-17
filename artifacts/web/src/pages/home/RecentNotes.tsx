import React from "react";
import { RotateCcw, FlaskConical } from "lucide-react";
import { NoteCard } from "./NoteCard";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface Props {
  items: RecentExperimentItem[];
  loading?: boolean;
  onItemClick: (id: string) => void;
}

/** Skeleton placeholder card — mirrors NoteCard's dimensions. */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
      <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-1/4" />
    </div>
  );
}

/**
 * RecentNotes — displays the "最近实验" card grid below the AI query box.
 *
 * States:
 *   loading=true        → header + 4 skeleton cards (context still initialising)
 *   items.length === 0  → header + empty state message
 *   items.length > 0    → header + 2-column card grid
 *
 * The section header ("最近实验") is always visible so the page layout
 * does not shift on load.
 */
export function RecentNotes({ items, loading = false, onItemClick }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw size={15} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-700">最近项目</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center max-w-2xl">
          <FlaskConical size={28} className="text-gray-200" />
          <p className="text-sm text-gray-400 font-medium">还没有实验记录</p>
          <p className="text-xs text-gray-300">
            创建第一个 SciNote 后，实验记录会出现在这里
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-2xl">
          {items.map((item) => (
            <NoteCard key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>
      )}
    </section>
  );
}
