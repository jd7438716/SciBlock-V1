import React from "react";
import { RotateCcw, FlaskConical } from "lucide-react";
import { NoteCard } from "./NoteCard";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface Props {
  items: RecentExperimentItem[];
  loading?: boolean;
  onItemClick: (id: string) => void;
}

/**
 * RecentNotes — displays the "最近实验" card grid below the AI query box.
 *
 * States:
 *   loading=true        → section is suppressed (context still initialising)
 *   items.length === 0  → empty state with a clear message
 *   items.length > 0    → 2-column card grid
 */
export function RecentNotes({ items, loading = false, onItemClick }: Props) {
  if (loading) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw size={15} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-700">最近实验</h2>
      </div>

      {items.length === 0 ? (
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
