/**
 * PersonalInfoTab — 学生个人信息（查看 / 编辑）
 *
 * Layer: component (detail tab)
 */

import { useState } from "react";
import type { Student, StudentDegree } from "../../../types/team";
import { DEGREE_LABELS } from "../../../types/team";
import { updateStudent } from "../../../api/team";

interface Props {
  student: Student;
  onUpdated: (s: Student) => void;
}

const DEGREES: { value: StudentDegree; label: string }[] = [
  { value: "bachelor", label: "本科" },
  { value: "master",   label: "硕士" },
  { value: "phd",      label: "博士" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function PersonalInfoTab({ student, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...student });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(k: keyof Student, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  async function save() {
    if (!form.name.trim()) { setError("姓名不能为空"); return; }
    setLoading(true);
    try {
      const { student: updated } = await updateStudent(student.id, {
        name: form.name,
        phone: form.phone ?? undefined,
        email: form.email ?? undefined,
        enrollmentYear: form.enrollmentYear,
        degree: form.degree,
        researchTopic: form.researchTopic,
      });
      onUpdated(updated);
      setEditing(false);
    } catch {
      setError("保存失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setForm({ ...student });
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">基本信息</h3>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-500 hover:text-black border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-400"
          >
            编辑
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">
          <Field label="姓名"     value={student.name} />
          <Field label="当前学位" value={DEGREE_LABELS[student.degree]} />
          <Field label="入学年份" value={`${student.enrollmentYear} 年`} />
          <Field label="联系电话" value={student.phone ?? ""} />
          <Field label="邮箱"     value={student.email ?? ""} />
          <Field label="研究课题" value={student.researchTopic} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">编辑基本信息</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">姓名</label>
          <input
            value={form.name}
            onChange={e => setField("name", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">学位</label>
            <select
              value={form.degree}
              onChange={e => setField("degree", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              {DEGREES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">入学年份</label>
            <select
              value={form.enrollmentYear}
              onChange={e => setField("enrollmentYear", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">联系电话</label>
          <input
            value={form.phone ?? ""}
            onChange={e => setField("phone", e.target.value || null)}
            placeholder="13800000000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">邮箱</label>
          <input
            type="email"
            value={form.email ?? ""}
            onChange={e => setField("email", e.target.value || null)}
            placeholder="student@university.edu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">研究课题</label>
          <textarea
            value={form.researchTopic}
            onChange={e => setField("researchTopic", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={cancel}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
