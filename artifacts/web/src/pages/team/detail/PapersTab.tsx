/**
 * PapersTab — 发表论文管理（查看 + 上传）
 *
 * Layer: component (detail tab)
 */

import { useState, useEffect } from "react";
import type { Paper, AddPaperRequest } from "../../../types/team";
import { fetchPapers, addPaper, deletePaper } from "../../../api/team";

interface Props {
  studentId: string;
}

const EMPTY_FORM: AddPaperRequest = {
  title: "", journal: "", year: new Date().getFullYear(),
  abstract: "", doi: "", fileName: "", isThesis: false,
};

export default function PapersTab({ studentId }: Props) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddPaperRequest>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers(studentId)
      .then(r => setPapers(r.papers.filter(p => !p.isThesis)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  function setField(k: keyof AddPaperRequest, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("论文标题必填"); return; }
    setSaving(true);
    try {
      const { paper } = await addPaper(studentId, { ...form, isThesis: false });
      setPapers(ps => [paper, ...ps]);
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    } catch {
      setError("上传失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function remove(paper: Paper) {
    if (!confirm(`确认删除论文《${paper.title}》？`)) return;
    try {
      await deletePaper(studentId, paper.id);
      setPapers(ps => ps.filter(p => p.id !== paper.id));
    } catch { /* ignore */ }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          发表论文
          {papers.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">共 {papers.length} 篇</span>
          )}
        </h3>
        <button
          onClick={() => { setShowForm(s => !s); setError(null); }}
          className="text-xs text-white bg-black rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          {showForm ? "取消" : "+ 添加论文"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={submit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">论文标题 *</label>
            <input
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              placeholder="请输入论文完整标题"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">期刊 / 会议</label>
              <input
                value={form.journal ?? ""}
                onChange={e => setField("journal", e.target.value)}
                placeholder="Nature, ACS Nano…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">发表年份</label>
              <input
                type="number"
                value={form.year ?? ""}
                onChange={e => setField("year", Number(e.target.value) || null)}
                min={1990} max={new Date().getFullYear()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">DOI</label>
            <input
              value={form.doi ?? ""}
              onChange={e => setField("doi", e.target.value)}
              placeholder="10.xxxx/xxxxxx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">摘要</label>
            <textarea
              value={form.abstract ?? ""}
              onChange={e => setField("abstract", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">文件名（可选）</label>
            <input
              value={form.fileName ?? ""}
              onChange={e => setField("fileName", e.target.value)}
              placeholder="paper.pdf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "保存中…" : "保存论文"}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">加载中…</p>
      ) : papers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm">暂无发表论文</p>
        </div>
      ) : (
        <div className="space-y-2">
          {papers.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(e => e === p.id ? null : p.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">📰</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[p.journal, p.year].filter(Boolean).join(" · ")}
                      {p.doi && <span className="ml-2 font-mono">DOI: {p.doi}</span>}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs mt-0.5">{expanded === p.id ? "▲" : "▼"}</span>
                </div>
              </button>
              {expanded === p.id && (
                <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
                  {p.abstract && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{p.abstract}</p>}
                  {p.fileName && (
                    <p className="text-xs text-gray-500 mt-2">📎 {p.fileName}</p>
                  )}
                  <button
                    onClick={() => remove(p)}
                    className="mt-3 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    删除此论文
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
