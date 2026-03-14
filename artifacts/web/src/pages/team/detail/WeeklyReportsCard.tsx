/**
 * WeeklyReportsCard — 周报卡片（查看 + 展开 + 提交新周报）
 *
 * Layer: component
 */

import { useState, useEffect } from "react";
import type { WeeklyReport, AddWeeklyReportRequest } from "../../../types/team";
import { fetchReports, addReport } from "../../../api/team";

interface Props {
  studentId: string;
}

const INITIAL_LIMIT = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Submit form
// ---------------------------------------------------------------------------

interface SubmitFormProps {
  onSave: (data: AddWeeklyReportRequest) => Promise<void>;
  onCancel: () => void;
}

function SubmitForm({ onSave, onCancel }: SubmitFormProps) {
  const [form, setForm] = useState<AddWeeklyReportRequest>({
    title: "",
    content: "",
    weekStart: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(k: keyof AddWeeklyReportRequest, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("周报标题必填"); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 mb-3 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">提交新周报</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">周报标题 *</label>
        <input
          value={form.title}
          onChange={e => setField("title", e.target.value)}
          placeholder="第 N 周实验进展报告"
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">周次起始日期 *</label>
        <input
          type="date"
          value={form.weekStart}
          onChange={e => setField("weekStart", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">周报内容</label>
        <textarea
          value={form.content}
          onChange={e => setField("content", e.target.value)}
          rows={5}
          placeholder="请描述本周工作进展、遇到的问题及下周计划…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
        />
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
          {saving ? "提交中…" : "提交"}
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
// Report row
// ---------------------------------------------------------------------------

function ReportRow({ report }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-2 last:mb-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left flex items-start gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-base flex-shrink-0 mt-0.5">📝</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(report.weekStart)} · 提交于 {new Date(report.submittedAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && report.content && (
        <div className="px-4 pb-4 pt-3 bg-white border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.content}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">周报</h2>
          {reports.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {reports.length} 份
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reports.length > INITIAL_LIMIT && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-xs text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded-lg px-2.5 py-1 transition-colors"
            >
              {showAll ? "收起" : `查看全部`}
            </button>
          )}
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-xs text-white bg-gray-900 hover:bg-black rounded-lg px-2.5 py-1 transition-colors"
          >
            {showForm ? "取消" : "+ 提交周报"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {showForm && (
          <SubmitForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">加载中…</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm">暂无周报</p>
          </div>
        ) : (
          <div className="space-y-0">
            {visible.map(r => (
              <ReportRow key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
