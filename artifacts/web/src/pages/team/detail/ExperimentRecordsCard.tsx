/**
 * ExperimentRecordsCard — 实验记录（PrepItemViewCard 风格列表）
 *
 * Layer: component
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useSciNoteStore } from "../../../contexts/SciNoteStoreContext";
import type { SciNote } from "../../../types/scinote";

const INITIAL_LIMIT = 5;

// ---------------------------------------------------------------------------
// Kind config (matches workbench)
// ---------------------------------------------------------------------------

const KIND_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  standard:         { label: "标准",   bg: "bg-gray-100",    text: "text-gray-500",    border: "border-gray-200" },
  material:         { label: "材料",   bg: "bg-blue-50",     text: "text-blue-600",    border: "border-blue-200" },
  synthesis:        { label: "合成",   bg: "bg-emerald-50",  text: "text-emerald-600", border: "border-emerald-200" },
  characterization: { label: "表征",   bg: "bg-violet-50",   text: "text-violet-600",  border: "border-violet-200" },
  test:             { label: "测试",   bg: "bg-amber-50",    text: "text-amber-600",   border: "border-amber-200" },
};

function kindMeta(kind: SciNote["kind"]) {
  return KIND_META[kind] ?? { label: kind, bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
}

// ---------------------------------------------------------------------------
// Single record row
// ---------------------------------------------------------------------------

function RecordRow({ note, onClick }: { note: SciNote; onClick: () => void }) {
  const meta = kindMeta(note.kind);
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm group">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Kind tag */}
        <span
          className={`flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap ${meta.bg} ${meta.text} ${meta.border}`}
        >
          {meta.label}
        </span>

        {/* Title — click to navigate */}
        <button
          onClick={onClick}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
          title="点击查看详情"
        >
          {note.title || "无标题实验"}
        </button>

        {/* Date pill */}
        {note.createdAt && (
          <span className="flex-shrink-0 inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-slate-500">
              {new Date(note.createdAt).toLocaleDateString("zh-CN", {
                month: "2-digit", day: "2-digit",
              })}
            </span>
          </span>
        )}

        {/* Navigate arrow */}
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 text-sm">
          ›
        </span>
      </div>

      {/* Attribute pill row */}
      {note.createdAt && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
            <span className="text-xs text-slate-500">
              创建时间: {new Date(note.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component (no wrapper card — section wrapper is in MemberDetailPage)
// ---------------------------------------------------------------------------

export default function ExperimentRecordsCard() {
  const { notes } = useSciNoteStore();
  const [, navigate] = useLocation();
  const [showAll, setShowAll] = useState(false);

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_LIMIT);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
        <p className="text-xs text-gray-400">暂无实验记录</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {visible.map(note => (
          <RecordRow
            key={note.id}
            note={note}
            onClick={() => navigate(`/personal/note/${note.id}`)}
          />
        ))}
      </div>

      {sorted.length > INITIAL_LIMIT && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="mt-2 w-full inline-flex items-center justify-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full py-1 transition-colors"
        >
          {showAll ? "收起" : `查看全部 ${sorted.length} 条`}
        </button>
      )}
    </div>
  );
}
