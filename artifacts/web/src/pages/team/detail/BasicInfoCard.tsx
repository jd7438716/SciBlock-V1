/**
 * BasicInfoCard — 学生基本信息（PrepItemViewCard 风格）
 *
 * 视图模式：分类标签(学位) | 姓名(粗体) | 状态标签 | 悬停✏️
 *           属性pill: 入学年份 / 电话 / 邮箱 / 研究课题
 * 编辑模式：展开为 PrepItemEditCard 风格表单
 *
 * Layer: component
 */

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";
import type { Student, StudentDegree } from "../../../types/team";
import { DEGREE_LABELS, DEGREE_OPTIONS } from "../../../types/team";
import { updateStudent } from "../../../api/team";

// ---------------------------------------------------------------------------
// FieldPill — single "key: value" pill with inline edit
// ---------------------------------------------------------------------------

interface FieldPillProps {
  label: string;
  value: string;
  inputWidth?: string;
  multiline?: boolean;
  onSave: (v: string) => Promise<void>;
}

function FieldPill({ label, value, inputWidth = "w-28", multiline = false, onSave }: FieldPillProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function start() { setDraft(value); setEditing(true); }

  async function confirm() {
    setSaving(true);
    try { await onSave(draft.trim()); setEditing(false); }
    finally { setSaving(false); }
  }

  function cancel() { setEditing(false); setDraft(value); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void confirm(); }
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    return (
      <span className="inline-flex items-start gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
        <span className="text-xs text-blue-400 flex-shrink-0 mt-0.5">{label}:</span>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="text-xs bg-transparent outline-none text-blue-700 resize-none w-48"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${inputWidth} text-xs bg-transparent outline-none text-blue-700`}
          />
        )}
        <button
          onClick={() => void confirm()}
          disabled={saving}
          className="text-green-600 hover:text-green-700 flex-shrink-0 mt-0.5"
        >
          <Check size={10} />
        </button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <span
      onClick={start}
      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:border-blue-100 border border-transparent rounded-full px-3 py-1 cursor-pointer transition-all group/pill"
      title="点击编辑"
    >
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className="w-px h-2.5 bg-slate-300 group-hover/pill:bg-blue-200 transition-colors" />
      <span className="text-[11px] text-slate-700">
        {value || <span className="text-slate-300 italic">未填写</span>}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// DegreePicker — 内联学位选择器
// ---------------------------------------------------------------------------

interface DegreePickerProps {
  value: StudentDegree;
  onSave: (v: StudentDegree) => Promise<void>;
  onCancel: () => void;
}

function DegreePicker({ value, onSave, onCancel }: DegreePickerProps) {
  const [draft, setDraft] = useState<StudentDegree>(value);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    try { await onSave(draft); }
    finally { setSaving(false); }
  }

  return (
    <span className="inline-flex flex-col gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5">
      <span className="text-[10px] text-blue-400">选择学位</span>
      <div className="flex gap-1 flex-wrap">
        {DEGREE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDraft(opt.value)}
            className={`text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none transition-colors ${
              draft === opt.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button onClick={() => void confirm()} disabled={saving} className="text-[10px] text-green-700 font-medium hover:underline">
          确认
        </button>
        <span className="text-gray-300 text-[10px]">·</span>
        <button onClick={onCancel} className="text-[10px] text-gray-400 hover:underline">取消</button>
      </div>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit form (PrepItemEditCard style)
// ---------------------------------------------------------------------------

interface EditFormProps {
  student: Student;
  onSave: (s: Student) => void;
  onCancel: () => void;
}

function EditForm({ student, onSave, onCancel }: EditFormProps) {
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);

  function set(k: keyof Student, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const { student: updated } = await updateStudent(student.id, {
        name: form.name,
        degree: form.degree,
        enrollmentYear: form.enrollmentYear,
        phone: form.phone ?? undefined,
        email: form.email ?? undefined,
        researchTopic: form.researchTopic,
      });
      onSave(updated);
    } finally { setSaving(false); }
  }

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Edit header */}
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
            className="flex items-center gap-0.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors font-medium"
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface Props {
  student: Student;
  onUpdated: (s: Student) => void;
}

export default function BasicInfoCard({ student, onUpdated }: Props) {
  const [editingFull, setEditingFull] = useState(false);
  const [editingDegree, setEditingDegree] = useState(false);

  async function saveField(patch: Partial<Student>) {
    const req: import("../../../types/team").UpdateStudentRequest = {
      name:           patch.name,
      degree:         patch.degree,
      enrollmentYear: patch.enrollmentYear,
      phone:          patch.phone ?? undefined,
      email:          patch.email ?? undefined,
      researchTopic:  patch.researchTopic,
    };
    const { student: updated } = await updateStudent(student.id, req);
    onUpdated(updated);
  }

  if (editingFull) {
    return (
      <EditForm
        student={student}
        onSave={s => { onUpdated(s); setEditingFull(false); }}
        onCancel={() => setEditingFull(false)}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm group">
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-50">
        {/* Degree tag — click to pick inline */}
        {editingDegree ? (
          <DegreePicker
            value={student.degree}
            onSave={async (v) => { await saveField({ degree: v }); setEditingDegree(false); }}
            onCancel={() => setEditingDegree(false)}
          />
        ) : (
          <button
            onClick={() => setEditingDegree(true)}
            className="flex-shrink-0 text-[10px] font-semibold border rounded-md px-2 py-1 leading-none whitespace-nowrap bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-colors"
            title="点击修改学位"
          >
            {DEGREE_LABELS[student.degree] ?? student.degree}
          </button>
        )}

        {/* Name — click to enter full edit mode */}
        <button
          onClick={() => setEditingFull(true)}
          className="flex-1 text-sm font-semibold text-gray-900 text-left hover:text-blue-600 transition-colors leading-snug min-w-0 truncate"
          title="点击编辑全部信息"
        >
          {student.name}
        </button>

        {/* Action buttons (hover) */}
        <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingFull(true)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded-md transition-colors bg-white"
            title="编辑全部信息"
          >
            <Pencil size={10} />
            编辑
          </button>
        </div>
      </div>

      {/* Attribute pills */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        <FieldPill
          label="入学年份"
          value={`${student.enrollmentYear}年`}
          inputWidth="w-16"
          onSave={async v => {
            const year = parseInt(v.replace("年", "")) || student.enrollmentYear;
            await saveField({ enrollmentYear: year });
          }}
        />
        <FieldPill
          label="电话"
          value={student.phone ?? ""}
          inputWidth="w-28"
          onSave={async v => saveField({ phone: v || null })}
        />
        <FieldPill
          label="邮箱"
          value={student.email ?? ""}
          inputWidth="w-40"
          onSave={async v => saveField({ email: v || null })}
        />
        <FieldPill
          label="研究课题"
          value={student.researchTopic}
          inputWidth="w-56"
          multiline
          onSave={async v => saveField({ researchTopic: v })}
        />
      </div>
    </div>
  );
}
