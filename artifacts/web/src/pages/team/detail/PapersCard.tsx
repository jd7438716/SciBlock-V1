/**
 * PapersCard — 论文信息卡片（发表论文 + 毕业论文合并展示）
 *
 * Layer: component
 */

import { useState, useEffect, useRef } from "react";
import type { Paper, AddPaperRequest } from "../../../types/team";
import { fetchPapers, addPaper, deletePaper } from "../../../api/team";

interface Props {
  studentId: string;
}

// ---------------------------------------------------------------------------
// Tag badge
// ---------------------------------------------------------------------------

function PaperTag({ isThesis }: { isThesis: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
        isThesis
          ? "bg-violet-100 text-violet-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {isThesis ? "毕业论文" : "学术论文"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Upload form
// ---------------------------------------------------------------------------

interface UploadFormProps {
  isThesis: boolean;
  onSave: (data: AddPaperRequest) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: Omit<AddPaperRequest, "isThesis"> = {
  title: "", journal: "", year: new Date().getFullYear(),
  abstract: "", doi: "", fileName: "",
};

function UploadForm({ isThesis, onSave, onCancel }: UploadFormProps) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField(k: keyof typeof EMPTY, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  function pickFile() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setField("fileName", file.name);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("论文标题必填"); return; }
    setSaving(true);
    try {
      await onSave({ ...form, isThesis });
    } catch {
      setError("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 mb-3 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {isThesis ? "上传毕业论文" : "添加学术论文"}
      </p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">论文标题 *</label>
        <input
          value={form.title}
          onChange={e => setField("title", e.target.value)}
          placeholder={isThesis ? "请输入毕业论文标题" : "请输入论文完整标题"}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      {!isThesis && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">期刊 / 会议</label>
            <input
              value={form.journal ?? ""}
              onChange={e => setField("journal", e.target.value)}
              placeholder="Nature, ACS Nano…"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">发表年份</label>
            <input
              type="number"
              value={form.year ?? ""}
              onChange={e => setField("year", Number(e.target.value) || null)}
              min={1990} max={new Date().getFullYear()}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
        </div>
      )}

      {isThesis && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">答辩年份</label>
          <input
            type="number"
            value={form.year ?? ""}
            onChange={e => setField("year", Number(e.target.value) || null)}
            min={1990} max={new Date().getFullYear() + 2}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">DOI（可选）</label>
        <input
          value={form.doi ?? ""}
          onChange={e => setField("doi", e.target.value)}
          placeholder="10.xxxx/xxxxxx"
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">摘要（可选）</label>
        <textarea
          value={form.abstract ?? ""}
          onChange={e => setField("abstract", e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
        />
      </div>

      {/* File picker */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={pickFile}
          className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2 w-full hover:bg-white hover:border-gray-400 transition-colors"
        >
          <span>📎</span>
          <span className="flex-1 text-left truncate">
            {form.fileName ? form.fileName : "选择文件（PDF / Word）"}
          </span>
          {form.fileName && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setField("fileName", ""); }}
              className="text-gray-400 hover:text-gray-600"
            >✕</button>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black disabled:opacity-60 transition-colors"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Single paper row
// ---------------------------------------------------------------------------

function PaperRow({
  paper,
  onDelete,
}: {
  paper: Paper;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const uploadedDate = new Date(paper.uploadedAt).toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-2 last:mb-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-base mt-0.5 flex-shrink-0">📄</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{paper.title}</p>
            <PaperTag isThesis={paper.isThesis} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {[paper.journal, paper.year].filter(Boolean).join(" · ")}
            {paper.doi && <span className="ml-2">DOI: {paper.doi}</span>}
            <span className="ml-2">上传于 {uploadedDate}</span>
          </p>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 bg-gray-50 space-y-2">
          {paper.abstract && (
            <p className="text-sm text-gray-700 leading-relaxed">{paper.abstract}</p>
          )}
          {paper.fileName && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <span>📎</span>
              <span>{paper.fileName}</span>
            </div>
          )}
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            删除此论文
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: published | thesis
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  papers: Paper[];
  isThesis: boolean;
  showingForm: boolean;
  onToggleForm: () => void;
  onSavePaper: (data: AddPaperRequest) => Promise<void>;
  onDeletePaper: (id: string) => void;
}

function PaperSection({
  title, papers, isThesis, showingForm,
  onToggleForm, onSavePaper, onDeletePaper,
}: SectionProps) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {papers.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{papers.length}</span>
          )}
        </div>
        <button
          onClick={onToggleForm}
          className="text-xs text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded-lg px-2.5 py-1 transition-colors"
        >
          {showingForm ? "收起" : "+ 上传"}
        </button>
      </div>

      {showingForm && (
        <UploadForm
          isThesis={isThesis}
          onSave={onSavePaper}
          onCancel={onToggleForm}
        />
      )}

      {papers.length === 0 && !showingForm ? (
        <div className="text-center py-5 text-gray-400">
          <p className="text-2xl mb-1">{isThesis ? "🎓" : "📰"}</p>
          <p className="text-xs">暂无{title}</p>
        </div>
      ) : (
        papers.map(p => (
          <PaperRow
            key={p.id}
            paper={p}
            onDelete={() => onDeletePaper(p.id)}
          />
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PapersCard({ studentId }: Props) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<"published" | "thesis" | null>(null);

  useEffect(() => {
    fetchPapers(studentId)
      .then(r => setPapers(r.papers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleSave(data: AddPaperRequest) {
    const { paper } = await addPaper(studentId, data);
    setPapers(ps => [paper, ...ps]);
    setShowForm(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该论文？")) return;
    try {
      await deletePaper(studentId, id);
      setPapers(ps => ps.filter(p => p.id !== id));
    } catch { /* ignore */ }
  }

  const published = papers.filter(p => !p.isThesis);
  const thesis    = papers.filter(p =>  p.isThesis);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">论文信息</h2>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">加载中…</div>
      ) : (
        <div className="px-6">
          <PaperSection
            title="发表论文"
            papers={published}
            isThesis={false}
            showingForm={showForm === "published"}
            onToggleForm={() => setShowForm(f => f === "published" ? null : "published")}
            onSavePaper={handleSave}
            onDeletePaper={handleDelete}
          />
          <PaperSection
            title="毕业论文"
            papers={thesis}
            isThesis={true}
            showingForm={showForm === "thesis"}
            onToggleForm={() => setShowForm(f => f === "thesis" ? null : "thesis")}
            onSavePaper={handleSave}
            onDeletePaper={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
