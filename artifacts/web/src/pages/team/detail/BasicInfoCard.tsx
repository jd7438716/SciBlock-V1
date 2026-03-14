/**
 * BasicInfoCard — 基本信息卡片（内联逐字段点击编辑）
 *
 * Layer: component
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { Student, StudentDegree } from "../../../types/team";
import { DEGREE_LABELS, DEGREE_OPTIONS } from "../../../types/team";
import { updateStudent } from "../../../api/team";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldKey = "name" | "degree" | "enrollmentYear" | "phone" | "email" | "researchTopic";

interface Props {
  student: Student;
  onUpdated: (s: Student) => void;
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pencil icon
// ---------------------------------------------------------------------------

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25l-3.183.708.708-3.183 7.262-7.262z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// EditableRow — single field row with read / edit states
// ---------------------------------------------------------------------------

interface EditableRowProps {
  label: string;
  displayValue: string;
  editing: boolean;
  onStartEdit: () => void;
  onSave: (raw: string) => void;
  onCancel: () => void;
  renderEditor: (save: () => void, cancel: () => void) => React.ReactNode;
  saving?: boolean;
}

function EditableRow({
  label, displayValue, editing,
  onStartEdit, onSave, onCancel,
  renderEditor, saving,
}: EditableRowProps) {
  void onSave; // used by renderEditor via closures
  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      {!editing ? (
        /* Read mode */
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={onStartEdit}
        >
          <span className="w-24 text-sm text-gray-400 flex-shrink-0 select-none">{label}</span>
          <span className="flex-1 text-sm text-gray-900 min-h-[1.25rem]">
            {displayValue || <span className="text-gray-300 italic">—</span>}
          </span>
          <span className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity flex-shrink-0">
            <PencilIcon />
          </span>
        </div>
      ) : (
        /* Edit mode */
        <div>
          <span className="block text-xs text-gray-400 mb-1.5 select-none">{label}</span>
          {renderEditor(
            () => { /* save handled inline in each editor */ },
            onCancel,
          )}
          {saving && (
            <p className="text-xs text-gray-400 mt-1">保存中…</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BasicInfoCard({ student, onUpdated }: Props) {
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      setTimeout(() => {
        (inputRef.current as HTMLElement | null)?.focus();
      }, 50);
    }
  }, [editing]);

  function startEdit(field: FieldKey) {
    const current = fieldCurrentValue(field);
    setDraft(current);
    setEditing(field);
  }

  function fieldCurrentValue(field: FieldKey): string {
    switch (field) {
      case "name":           return student.name;
      case "degree":         return student.degree;
      case "enrollmentYear": return String(student.enrollmentYear);
      case "phone":          return student.phone ?? "";
      case "email":          return student.email ?? "";
      case "researchTopic":  return student.researchTopic;
    }
  }

  const save = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {};
      switch (editing) {
        case "name":           patch.name = draft.trim(); break;
        case "degree":         patch.degree = draft; break;
        case "enrollmentYear": patch.enrollmentYear = parseInt(draft) || student.enrollmentYear; break;
        case "phone":          patch.phone = draft.trim() || null; break;
        case "email":          patch.email = draft.trim() || null; break;
        case "researchTopic":  patch.researchTopic = draft.trim(); break;
      }
      const { student: updated } = await updateStudent(student.id, patch);
      onUpdated(updated);
      setEditing(null);
    } catch {
      // silently ignore — keep editing open
    } finally {
      setSaving(false);
    }
  }, [editing, draft, student, onUpdated]);

  function cancel() { setEditing(null); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void save(); }
    if (e.key === "Escape") cancel();
  }

  // Current year for validation
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // ---------------------------------------------------------------------------
  // Shared save/cancel button row
  // ---------------------------------------------------------------------------

  function ActionRow() {
    return (
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="px-3 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors"
        >
          保存
        </button>
        <button
          onClick={cancel}
          className="px-3 py-1 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Field display values
  // ---------------------------------------------------------------------------

  const displayValues: Record<FieldKey, string> = {
    name:           student.name,
    degree:         DEGREE_LABELS[student.degree] ?? student.degree,
    enrollmentYear: `${student.enrollmentYear} 年`,
    phone:          student.phone ?? "",
    email:          student.email ?? "",
    researchTopic:  student.researchTopic,
  };

  // ---------------------------------------------------------------------------
  // Field editors
  // ---------------------------------------------------------------------------

  function textEditor(field: FieldKey, placeholder = "", type: "text" | "email" | "tel" = "text") {
    return (_save: () => void, _cancel: () => void) => (
      <>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <ActionRow />
      </>
    );
  }

  function degreeEditor() {
    return (_save: () => void, _cancel: () => void) => (
      <>
        <div className="flex gap-2 flex-wrap">
          {DEGREE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDraft(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                draft === opt.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ActionRow />
      </>
    );
  }

  function yearEditor() {
    return (_save: () => void, _cancel: () => void) => (
      <>
        <div className="flex gap-2 flex-wrap">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setDraft(String(y))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                draft === String(y)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <ActionRow />
      </>
    );
  }

  function topicEditor() {
    return (_save: () => void, _cancel: () => void) => (
      <>
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") cancel(); }}
          rows={3}
          placeholder="请输入研究课题"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
        />
        <ActionRow />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const fields: Array<{
    key: FieldKey;
    label: string;
    editor: (save: () => void, cancel: () => void) => React.ReactNode;
  }> = [
    { key: "name",           label: "姓名",     editor: textEditor("name", "请输入姓名") },
    { key: "degree",         label: "当前学位", editor: degreeEditor() },
    { key: "enrollmentYear", label: "入学年份", editor: yearEditor() },
    { key: "phone",          label: "联系电话", editor: textEditor("phone", "请输入电话号码", "tel") },
    { key: "email",          label: "邮箱",     editor: textEditor("email", "请输入邮箱地址", "email") },
    { key: "researchTopic",  label: "研究课题", editor: topicEditor() },
  ];

  return (
    <InfoCard title="基本信息">
      {fields.map(f => (
        <EditableRow
          key={f.key}
          label={f.label}
          displayValue={displayValues[f.key]}
          editing={editing === f.key}
          onStartEdit={() => startEdit(f.key)}
          onSave={save}
          onCancel={cancel}
          renderEditor={f.editor}
          saving={saving}
        />
      ))}
    </InfoCard>
  );
}
