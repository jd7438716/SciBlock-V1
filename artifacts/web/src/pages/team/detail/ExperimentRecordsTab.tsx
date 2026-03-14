/**
 * ExperimentRecordsTab — 实验记录
 *
 * Reads SciNotes from SciNoteStoreContext (shared sessionStorage).
 * The current implementation shows the global experiment list and provides links
 * into the individual SciNote detail pages — in the future each student's
 * experiments can be filtered by ownership.
 *
 * Layer: component (detail tab)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useSciNoteStore } from "../../../contexts/SciNoteStoreContext";
import type { SciNote } from "../../../types/scinote";

const INITIAL_LIMIT = 5;

function kindLabel(kind: SciNote["kind"]): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    standard:      { label: "标准",   color: "bg-gray-100 text-gray-600"     },
    material:      { label: "材料",   color: "bg-blue-100 text-blue-700"     },
    synthesis:     { label: "合成",   color: "bg-emerald-100 text-emerald-700" },
    characterization: { label: "表征", color: "bg-violet-100 text-violet-700" },
    test:          { label: "测试",   color: "bg-amber-100 text-amber-700"   },
  };
  return map[kind] ?? { label: kind, color: "bg-gray-100 text-gray-600" };
}

export default function ExperimentRecordsTab() {
  const { notes } = useSciNoteStore();
  const [, navigate] = useLocation();
  const [showAll, setShowAll] = useState(false);

  // Sort newest-first (createdAt is optional on legacy SciNotes)
  const sorted = [...notes].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_LIMIT);

  function goToNote(id: string) {
    navigate(`/personal/note/${id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          实验记录
          <span className="ml-2 text-xs font-normal text-gray-400">共 {sorted.length} 条</span>
        </h3>
        {sorted.length > INITIAL_LIMIT && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-xs text-gray-500 hover:text-black border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-400"
          >
            {showAll ? "收起" : `查看全部 ${sorted.length} 条`}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">🔬</p>
          <p className="text-sm font-medium text-gray-500">暂无实验记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(note => {
            const { label, color } = kindLabel(note.kind);
            return (
              <button
                key={note.id}
                onClick={() => goToNote(note.id)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group"
              >
                <span className="text-xl">🧪</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-black">
                    {note.title || "无标题实验"}
                  </p>
                  {note.createdAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(note.createdAt).toLocaleDateString("zh-CN", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} flex-shrink-0`}>
                  {label}
                </span>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
