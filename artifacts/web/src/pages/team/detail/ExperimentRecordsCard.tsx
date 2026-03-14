/**
 * ExperimentRecordsCard — 实验记录卡片
 *
 * Reads SciNotes from the global store (sessionStorage-backed) and presents
 * them as clickable links. Shows 5 by default; expand to see all.
 *
 * Layer: component
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useSciNoteStore } from "../../../contexts/SciNoteStoreContext";
import type { SciNote } from "../../../types/scinote";

const INITIAL_LIMIT = 5;

// ---------------------------------------------------------------------------
// Kind helpers
// ---------------------------------------------------------------------------

const KIND_META: Record<string, { label: string; color: string; icon: string }> = {
  standard:         { label: "标准",   color: "bg-gray-100 text-gray-600",       icon: "🧪" },
  material:         { label: "材料",   color: "bg-blue-100 text-blue-700",       icon: "🔩" },
  synthesis:        { label: "合成",   color: "bg-emerald-100 text-emerald-700", icon: "⚗️"  },
  characterization: { label: "表征",   color: "bg-violet-100 text-violet-700",   icon: "🔬" },
  test:             { label: "测试",   color: "bg-amber-100 text-amber-700",     icon: "📊" },
};

function kindMeta(kind: SciNote["kind"]) {
  return KIND_META[kind] ?? { label: kind, color: "bg-gray-100 text-gray-600", icon: "📁" };
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function RecordRow({ note, onClick }: { note: SciNote; onClick: () => void }) {
  const meta = kindMeta(note.kind);
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <span className="text-lg flex-shrink-0">{meta.icon}</span>
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
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${meta.color}`}>
        {meta.label}
      </span>
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0">›</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export default function ExperimentRecordsCard() {
  const { notes } = useSciNoteStore();
  const [, navigate] = useLocation();
  const [showAll, setShowAll] = useState(false);

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_LIMIT);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">实验记录</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {sorted.length} 条
          </span>
        </div>
        {sorted.length > INITIAL_LIMIT && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-xs text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded-lg px-2.5 py-1 transition-colors"
          >
            {showAll ? "收起" : `查看全部 ${sorted.length} 条`}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🔬</p>
            <p className="text-sm">暂无实验记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(note => (
              <RecordRow
                key={note.id}
                note={note}
                onClick={() => navigate(`/personal/note/${note.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
