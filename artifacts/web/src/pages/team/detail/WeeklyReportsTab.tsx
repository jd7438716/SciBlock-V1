/**
 * WeeklyReportsTab — 周报（查看 + 提交 + 详情展开）
 *
 * Layer: component (detail tab)
 */

import { useState, useEffect } from "react";
import type { WeeklyReport, AddWeeklyReportRequest } from "../../../types/team";
import { fetchReports, addReport } from "../../../api/team";

interface Props {
  studentId: string;
}

const INITIAL_LIMIT = 5;

function formatWeekDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default function WeeklyReportsTab({ studentId }: Props) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState<AddWeeklyReportRequest>({
    title: "",
    content: "",
    weekStart: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports(studentId)
      .then(r => setReports(r.reports))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  function setField(k: keyof AddWeeklyReportRequest, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("周报标题必填"); return; }
    setSaving(true);
    try {
      const { report } = await addReport(studentId, form);
      setReports(rs => [report, ...rs]);
      setShowForm(false);
      setForm({ title: "", content: "", weekStart: new Date().toISOString().slice(0, 10) });
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  const visible = showAll ? reports : reports.slice(0, INITIAL_LIMIT);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          周报
          {reports.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">共 {reports.length} 份</span>
          )}
        </h3>
        <button
          onClick={() => { setShowForm(s => !s); setError(null); }}
          className="text-xs text-white bg-black rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          {showForm ? "取消" : "+ 提交周报"}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <form onSubmit={submit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">周报标题 *</label>
            <input
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              placeholder="第 N 周实验进展报告"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">周次起始日期 *</label>
            <input
              type="date"
              value={form.weekStart}
              onChange={e => setField("weekStart", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">周报内容</label>
            <textarea
              value={form.content}
              onChange={e => setField("content", e.target.value)}
              rows={6}
              placeholder="请描述本周的工作进展、遇到的问题及下周计划…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "提交中…" : "提交周报"}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">加载中…</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-sm font-medium text-gray-500">暂无周报</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map(r => (
              <div key={r.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(e => e === r.id ? null : r.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatWeekDate(r.weekStart)} · 提交于 {new Date(r.submittedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs ml-3 mt-0.5 flex-shrink-0">
                      {expanded === r.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
                {expanded === r.id && r.content && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {reports.length > INITIAL_LIMIT && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-black border border-gray-200 rounded-xl hover:border-gray-400 transition-colors"
            >
              {showAll ? "收起" : `查看全部 ${reports.length} 份周报`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
