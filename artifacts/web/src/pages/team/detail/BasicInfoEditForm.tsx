/**
 * BasicInfoEditForm — 学生基本信息全量编辑表单
 *
 * PrepItemEditCard 风格：灰色顶栏 + 字段列表
 * 调用 updateStudent API，成功后回调 onSave
 *
 * Layer: detail sub-component
 */

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Student } from "../../../types/team";
import { DEGREE_OPTIONS } from "../../../types/team";
import { updateStudent } from "../../../api/team";

export interface BasicInfoEditFormProps {
  student:  Student;
  onSave:   (updated: Student) => void;
  onCancel: () => void;
}

export function BasicInfoEditForm({ student, onSave, onCancel }: BasicInfoEditFormProps) {
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);

  function set(k: keyof Student, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { student: updated } = await updateStudent(student.id, {
        name:           form.name,
        degree:         form.degree,
        enrollmentYear: form.enrollmentYear,
        phone:          form.phone  ?? undefined,
        email:          form.email  ?? undefined,
        researchTopic:  form.researchTopic,
      });
      onSave(updated);
    } finally {
      setSaving(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-medium text-gray-700 truncate">
          {form.name.trim() || "学生信息"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded transition-colors"
          >
            <X size={12} /> 取消
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-0.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 font-medium transition-colors"
          >
            <Check size={12} /> 保存
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="px-3 py-3 flex flex-col gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">姓名 *</span>
          <input
            autoFocus
            value={form.name}
            onChange={e => set("name", e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && form.name.trim()) void save(); }}
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Degree */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">当前学位</span>
          <div className="flex gap-1.5 flex-wrap">
            {DEGREE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("degree", opt.value)}
                className={`text-xs font-medium border rounded-full px-3 py-1 leading-none transition-colors ${
                  form.degree === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enrollment year */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">入学年份</span>
          <div className="flex gap-1.5 flex-wrap">
            {YEARS.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => set("enrollmentYear", y)}
                className={`text-xs border rounded-full px-2.5 py-1 leading-none transition-colors ${
                  form.enrollmentYear === y
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-500"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">联系电话</span>
          <input
            value={form.phone ?? ""}
            onChange={e => set("phone", e.target.value || null)}
            placeholder="13800000000"
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">邮箱</span>
          <input
            type="email"
            value={form.email ?? ""}
            onChange={e => set("email", e.target.value || null)}
            placeholder="student@university.edu"
            className="h-8 text-sm border border-gray-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Research topic */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">研究课题</span>
          <textarea
            value={form.researchTopic}
            onChange={e => set("researchTopic", e.target.value)}
            rows={2}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
