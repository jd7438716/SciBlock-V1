/**
 * ThesisTab — 毕业论文（查看 + 上传）
 *
 * Layer: component (detail tab)
 */

import { useState, useEffect } from "react";
import type { Paper, AddPaperRequest } from "../../../types/team";
import { fetchPapers, addPaper, deletePaper } from "../../../api/team";

interface Props {
  studentId: string;
}

export default function ThesisTab({ studentId }: Props) {
  const [thesis, setThesis] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<AddPaperRequest, "isThesis">>({
    title: "", journal: "", year: new Date().getFullYear(),
    abstract: "", doi: "", fileName: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers(studentId)
      .then(r => {
        const t = r.papers.find(p => p.isThesis) ?? null;
        setThesis(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  function setField(k: keyof typeof form, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("论文标题必填"); return; }
    setSaving(true);
    try {
      const { paper } = await addPaper(studentId, { ...form, isThesis: true });
      setThesis(paper);
      setShowForm(false);
    } catch {
      setError("上传失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!thesis) return;
    if (!confirm("确认删除毕业论文信息？")) return;
    try {
      await deletePaper(studentId, thesis.id);
      setThesis(null);
    } catch { /* ignore */ }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">加载中…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">毕业论文</h3>
        {!thesis && (
          <button
            onClick={() => { setShowForm(s => !s); setError(null); }}
            className="text-xs text-white bg-black rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            {showForm ? "取消" : "+ 上传毕业论文"}
          </button>
        )}
      </div>

      {/* Upload form */}
      {showForm && !thesis && (
        <form onSubmit={submit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">论文标题 *</label>
            <input
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              placeholder="请输入毕业论文完整标题"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">答辩年份</label>
              <input
                type="number"
                value={form.year ?? ""}
                onChange={e => setField("year", Number(e.target.value) || null)}
                min={1990} max={new Date().getFullYear() + 1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">文件名（可选）</label>
              <input
                value={form.fileName ?? ""}
                onChange={e => setField("fileName", e.target.value)}
                placeholder="thesis.pdf"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">摘要</label>
            <textarea
              value={form.abstract ?? ""}
              onChange={e => setField("abstract", e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "保存中…" : "保存毕业论文"}
          </button>
        </form>
      )}

      {/* Current thesis display */}
      {thesis ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-5 py-5 text-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🎓</span>
              <div className="flex-1">
                <p className="text-base font-semibold leading-snug">{thesis.title}</p>
                {thesis.year && (
                  <p className="text-sm text-gray-300 mt-1">{thesis.year} 年答辩</p>
                )}
              </div>
            </div>
          </div>
          {(thesis.abstract || thesis.fileName) && (
            <div className="px-5 py-4">
              {thesis.abstract && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">摘要</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{thesis.abstract}</p>
                </div>
              )}
              {thesis.fileName && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <span>📎</span>
                  <span>{thesis.fileName}</span>
                </div>
              )}
            </div>
          )}
          <div className="px-5 pb-4">
            <button
              onClick={remove}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              删除毕业论文
            </button>
          </div>
        </div>
      ) : !showForm ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">🎓</p>
          <p className="text-sm font-medium text-gray-500">暂无毕业论文</p>
          <p className="text-xs mt-1">点击上方按钮上传毕业论文信息</p>
        </div>
      ) : null}
    </div>
  );
}
