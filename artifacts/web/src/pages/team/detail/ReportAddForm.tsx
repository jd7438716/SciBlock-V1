/**
 * ReportAddForm — 提交新周报表单（PrepItemEditCard 风格）
 *
 * Layer: detail sub-component
 */

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { AddWeeklyReportRequest } from "../../../types/team";

export interface ReportAddFormProps {
  onSave:   (data: AddWeeklyReportRequest) => Promise<void>;
  onCancel: () => void;
}

export function ReportAddForm({ onSave, onCancel }: ReportAddFormProps) {
  const [form, setForm] = useState<AddWeeklyReportRequest>({
    title:     "",
    content:   "",
    weekStart: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

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
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-medium text-gray-600 truncate">
          {form.title.trim() || "新周报"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded"
          >
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

      {/* Body */}
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
          <span className="text-xs font-medium text-gray-500">周次起始日期</span>
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

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{error}</p>
        )}
      </div>
    </div>
  );
}
