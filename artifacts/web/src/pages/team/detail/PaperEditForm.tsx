/**
 * PaperEditForm — 论文编辑 / 上传表单（PrepItemEditCard 风格）
 *
 * 同时用于：新建论文 + 编辑已有论文（初始值通过 initial 注入）
 *
 * Layer: detail sub-component
 */

import { useState, useRef } from "react";
import { Check, X } from "lucide-react";
import type { Paper, AddPaperRequest } from "../../../types/team";
import { PaperTypeTag } from "../../../components/team/PaperTypeTag";

export interface PaperEditFormProps {
  initial:  Partial<Paper> & { isThesis: boolean };
  onSave:   (data: AddPaperRequest) => Promise<void>;
  onCancel: () => void;
}

export function PaperEditForm({ initial, onSave, onCancel }: PaperEditFormProps) {
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
  const [error,  setError]  = useState<string | null>(null);
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
          <PaperTypeTag isThesis={form.isThesis} />
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
        {/* Title */}
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

        {/* Published-only: journal + year */}
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

        {/* Thesis-only: defense year */}
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

        {/* DOI */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">DOI（可选）</span>
          <input
            value={form.doi ?? ""}
            onChange={e => set("doi", e.target.value)}
            placeholder="10.xxxx/xxxxxx"
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Abstract */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">摘要（可选）</span>
          <textarea
            value={form.abstract ?? ""}
            onChange={e => set("abstract", e.target.value)}
            rows={2}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
          />
        </div>

        {/* File picker */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">论文文件</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={e => set("fileName", e.target.files?.[0]?.name ?? "")}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-8 text-sm border border-dashed border-gray-300 rounded-lg px-2.5 text-left text-gray-500 hover:bg-gray-50 transition-colors truncate"
          >
            {form.fileName || "选择文件（PDF / Word）"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{error}</p>
        )}
      </div>
    </div>
  );
}
