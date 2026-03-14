/**
 * PapersCard — 论文信息（PrepItemViewCard 风格）
 *
 * 每篇论文 = 一个卡片条目
 *   标题行: [学术论文/毕业论文] | 论文标题 | ✏️ 🗑️（悬停）
 *   属性行: [期刊: ...] [年份: ...] [DOI: ...]
 *
 * Layer: component
 */

import { useState, useEffect, useRef } from "react";
import { Check, X, Pencil, Trash2, Plus } from "lucide-react";
import type { Paper, AddPaperRequest } from "../../../types/team";
import { fetchPapers, addPaper, deletePaper } from "../../../api/team";

interface Props {
  studentId: string;
  onCountChange?: (count: number) => void;
}

// ---------------------------------------------------------------------------
// Attribute pill (read-only in this component — paper fields are edited via full form)
// ---------------------------------------------------------------------------

function AttrPill({ label, value }: { label: string; value: string | number | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
      <span className="text-xs text-slate-600">{label}: {value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Paper type tag
// ---------------------------------------------------------------------------

function TypeTag({ isThesis }: { isThesis: boolean }) {
  return (
    <span
      className={`flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap ${
        isThesis
          ? "bg-violet-50 text-violet-600 border-violet-200"
          : "bg-blue-50 text-blue-600 border-blue-200"
      }`}
    >
      {isThesis ? "毕业论文" : "学术论文"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Paper edit form (PrepItemEditCard style)
// ---------------------------------------------------------------------------

interface EditFormProps {
  initial: Partial<Paper> & { isThesis: boolean };
  onSave: (data: AddPaperRequest) => Promise<void>;
  onCancel: () => void;
}

function PaperEditForm({ initial, onSave, onCancel }: EditFormProps) {
  const [form, setForm] = useState<AddPaperRequest>({
    title:    initial.title    ?? "",
    journal:  initial.journal  ?? "",
    year:     initial.year     ?? new Date().getFullYear(),
    abstract: initial.abstract ?? "",
    doi:      initial.doi      ?? "",
    fileName: initial.fileName ?? "",
    isThesis: initial.isThesis,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(k: keyof AddPaperRequest, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function save() {
    if (!form.title.trim()) { setError("论文标题必填"); return; }
    setSaving(true);
    try { await onSave(form); }
    catch { setError("保存失败，请重试"); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <TypeTag isThesis={form.isThesis} />
          <span className="text-sm font-medium text-gray-600 truncate">
            {form.title.trim() || (form.isThesis ? "新毕业论文" : "新发表论文")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded transition-colors"
          >
            <X size={12} /> 取消
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex items-center gap-0.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 font-medium transition-colors"
          >
            <Check size={12} /> 保存
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">论文标题 *</span>
          <input
            autoFocus
            value={form.title}
            onChange={e => set("title", e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void save(); }}
            placeholder={form.isThesis ? "请输入毕业论文标题" : "请输入论文完整标题"}
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {!form.isThesis && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">期刊 / 会议</span>
              <input
                value={form.journal ?? ""}
                onChange={e => set("journal", e.target.value)}
                placeholder="ACS Nano, Nature…"
                className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">发表年份</span>
              <input
                type="number"
                value={form.year ?? ""}
                onChange={e => set("year", Number(e.target.value) || null)}
                min={1990} max={new Date().getFullYear()}
                className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        )}

        {form.isThesis && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">答辩年份</span>
            <input
              type="number"
              value={form.year ?? ""}
              onChange={e => set("year", Number(e.target.value) || null)}
              min={2000} max={new Date().getFullYear() + 2}
              className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">DOI（可选）</span>
          <input
            value={form.doi ?? ""}
            onChange={e => set("doi", e.target.value)}
            placeholder="10.xxxx/xxxxxx"
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">摘要（可选）</span>
          <textarea
            value={form.abstract ?? ""}
            onChange={e => set("abstract", e.target.value)}
            rows={2}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
          />
        </div>

        {/* File selector */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">论文文件</span>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => set("fileName", e.target.files?.[0]?.name ?? "")} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-8 text-sm border border-dashed border-gray-300 rounded-lg px-2.5 text-left text-gray-500 hover:bg-gray-50 transition-colors truncate"
          >
            {form.fileName || "选择文件（PDF / Word）"}
          </button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{error}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single paper view card
// ---------------------------------------------------------------------------

function PaperViewCard({
  paper, onEdit, onDelete,
}: {
  paper: Paper;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm group">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <TypeTag isThesis={paper.isThesis} />
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
          title="点击展开/收起"
        >
          {paper.title}
        </button>
        {/* Hover actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
            title="编辑"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            title="删除"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Attribute pills */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        <AttrPill label="期刊" value={paper.journal} />
        <AttrPill label="年份" value={paper.year} />
        <AttrPill label="DOI" value={paper.doi} />
        <AttrPill
          label="上传"
          value={new Date(paper.uploadedAt).toLocaleDateString("zh-CN")}
        />
      </div>

      {/* Expanded abstract */}
      {expanded && (paper.abstract || paper.fileName) && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/40 rounded-b-lg">
          {paper.abstract && (
            <p className="text-xs text-gray-600 leading-relaxed">{paper.abstract}</p>
          )}
          {paper.fileName && (
            <p className="text-[10px] text-blue-500 mt-1">📎 {paper.fileName}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PapersCard({ studentId, onCountChange }: Props) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<"published" | "thesis" | null>(null);
  const [editing, setEditing] = useState<Paper | null>(null);

  function updatePapers(next: Paper[]) {
    setPapers(next);
    onCountChange?.(next.length);
  }

  useEffect(() => {
    fetchPapers(studentId)
      .then(r => { setPapers(r.papers); onCountChange?.(r.papers.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleSave(data: AddPaperRequest) {
    const { paper } = await addPaper(studentId, data);
    updatePapers([paper, ...papers]);
    setAdding(null);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该论文？")) return;
    try {
      await deletePaper(studentId, id);
      updatePapers(papers.filter(p => p.id !== id));
    } catch { /* ignore */ }
  }

  const published = papers.filter(p => !p.isThesis);
  const thesis    = papers.filter(p =>  p.isThesis);

  function Section({
    title, items, isThesis,
  }: {
    title: string; items: Paper[]; isThesis: boolean;
  }) {
    const isAdding = adding === (isThesis ? "thesis" : "published");
    const isEditing = editing?.isThesis === isThesis;

    return (
      <div className="mb-4 last:mb-0">
        {/* Section sub-header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-400">{title}</span>
          <button
            onClick={() => { setAdding(isThesis ? "thesis" : "published"); setEditing(null); }}
            className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-0.5 transition-colors"
          >
            <Plus size={10} />
            上传
          </button>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="mb-2">
            <PaperEditForm
              initial={{ isThesis }}
              onSave={handleSave}
              onCancel={() => setAdding(null)}
            />
          </div>
        )}

        {/* Paper cards */}
        {items.length === 0 && !isAdding ? (
          <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
            <p className="text-xs text-gray-400">暂无{title}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.map(p => (
              editing?.id === p.id ? (
                <PaperEditForm
                  key={p.id}
                  initial={p}
                  onSave={async data => {
                    // For edit, delete old and create new
                    await deletePaper(studentId, p.id);
                    const { paper: newP } = await addPaper(studentId, data);
                    updatePapers([newP, ...papers.filter(x => x.id !== p.id)]);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <PaperViewCard
                  key={p.id}
                  paper={p}
                  onEdit={() => { setEditing(p); setAdding(null); }}
                  onDelete={() => handleDelete(p.id)}
                />
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-6 text-xs text-gray-400">加载中…</div>
    );
  }

  return (
    <div>
      <Section title="发表论文" items={published} isThesis={false} />
      <Section title="毕业论文" items={thesis}    isThesis={true}  />
    </div>
  );
}
