/**
 * InviteModal — 邀请新成员弹窗
 *
 * Layer: component
 */

import { useState, useRef, useEffect } from "react";
import type { InviteStudentRequest, StudentDegree } from "../../types/team";
import { inviteStudent } from "../../api/team";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const DEGREES: { value: StudentDegree; label: string }[] = [
  { value: "bachelor", label: "本科" },
  { value: "master",   label: "硕士" },
  { value: "phd",      label: "博士" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - i);

export default function InviteModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<InviteStudentRequest>({
    name: "",
    email: "",
    phone: "",
    enrollmentYear: currentYear,
    degree: "master",
    researchTopic: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function set(k: keyof InviteStudentRequest, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.researchTopic.trim()) {
      setError("请填写姓名和研究课题");
      return;
    }
    setLoading(true);
    try {
      await inviteStudent(form);
      onCreated();
    } catch {
      setError("邀请失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">邀请团队成员</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="请输入学生姓名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="student@university.edu"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"
            />
          </div>

          {/* Degree + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学位</label>
              <select
                value={form.degree}
                onChange={e => set("degree", e.target.value as StudentDegree)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {DEGREES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">入学年份</label>
              <select
                value={form.enrollmentYear}
                onChange={e => set("enrollmentYear", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Research topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              研究课题 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.researchTopic}
              onChange={e => set("researchTopic", e.target.value)}
              placeholder="请输入研究课题名称"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {loading ? "邀请中…" : "发送邀请"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
