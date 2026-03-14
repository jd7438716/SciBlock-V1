/**
 * WeeklyReportsCard — 周报（PrepItemViewCard 风格）
 *
 * 每份周报 = 一个卡片条目
 *   标题行: [第N周] | 周报标题 | 展开箭头
 *   属性行: [提交: yyyy-mm-dd]
 *   展开内容: 周报正文
 *
 * Layer: component
 */

import { useState, useEffect } from "react";
import { Plus, Check, X } from "lucide-react";
import type { WeeklyReport, AddWeeklyReportRequest } from "../../../types/team";
import { fetchReports, addReport } from "../../../api/team";

interface Props {
  studentId: string;
}

const INITIAL_LIMIT = 5;

// ---------------------------------------------------------------------------
// Add form
// ---------------------------------------------------------------------------

function AddForm({ onSave, onCancel }: {
  onSave: (data: AddWeeklyReportRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddWeeklyReportRequest>({
    title: "", content: "",
    weekStart: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof AddWeeklyReportRequest, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function save() {
    if (!form.title.trim()) { setError("标题必填"); return; }
    setSaving(true);
    try { await onSave(form); }
    catch { setError("提交失败"); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-2">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-medium text-gray-600 truncate">
          {form.title.trim() || "新周报"}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded">
            <X size={12} /> 取消
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex items-center gap-0.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 font-medium"
          >
            <Check size={12} /> 提交
          </button>
        </div>
      </div>
      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">标题 *</span>
          <input
            autoFocus
            value={form.title}
            onChange={e => set("title", e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void save(); }}
            placeholder="第 N 周实验进展报告"
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">周次起始日期 *</span>
          <input
            type="date"
            value={form.weekStart}
            onChange={e => set("weekStart", e.target.value)}
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">内容</span>
          <textarea
            value={form.content}
            onChange={e => set("content", e.target.value)}
            rows={4}
            placeholder="本周工作进展、问题与下周计划…"
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
          />
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{error}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single report card
// ---------------------------------------------------------------------------

function ReportCard({ report }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);

  // Derive week label from weekStart e.g. "2026-03-09" → "03-09 周"
  const weekLabel = (() => {
    const d = new Date(report.weekStart + "T00:00:00");
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} 周`;
  })();

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm group">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Week tag */}
        <span className="flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap bg-gray-100 text-gray-500 border-gray-200">
          {weekLabel}
        </span>

        {/* Title */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
        >
          {report.title}
        </button>

        {/* Expand indicator */}
        <span className="flex-shrink-0 text-xs text-gray-300 group-hover:text-gray-500 transition-colors">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Attribute pill row */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
          <span className="text-xs text-slate-500">
            提交: {new Date(report.submittedAt).toLocaleDateString("zh-CN")}
          </span>
        </span>
      </div>

      {/* Expanded content */}
      {expanded && report.content && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/40 rounded-b-lg">
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
            {report.content}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WeeklyReportsCard({ studentId }: Props) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReports(studentId)
      .then(r => setReports(r.reports))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleSave(data: AddWeeklyReportRequest) {
    const { report } = await addReport(studentId, data);
    setReports(rs => [report, ...rs]);
    setShowForm(false);
  }

  const visible = showAll ? reports : reports.slice(0, INITIAL_LIMIT);

  if (loading) return <p className="text-xs text-gray-400 py-4 text-center">加载中…</p>;

  return (
    <div>
      {/* Add form */}
      {showForm && (
        <AddForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {/* Report cards */}
      {reports.length === 0 && !showForm ? (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400">暂无周报</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {visible.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex gap-2 mt-2">
        {reports.length > INITIAL_LIMIT && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="flex-1 inline-flex items-center justify-center text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full py-1 transition-colors"
          >
            {showAll ? "收起" : `查看全部 ${reports.length} 份`}
          </button>
        )}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 transition-colors"
          >
            <Plus size={10} />
            提交周报
          </button>
        )}
      </div>
    </div>
  );
}
