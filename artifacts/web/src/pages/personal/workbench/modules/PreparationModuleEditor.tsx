/**
 * PreparationModuleEditor — per-item inline editing for the 实验准备 module.
 *
 * Aligned with SystemModuleEditor:
 *  - VIEW card: category badge + name (click-to-edit) + AttributeTagRow (direct edit)
 *  - EDIT card: name, category pills, AttributeTagRow, description, attachments
 *  - attributes: Tag[] — same key:value structure as 实验系统
 */

import React, { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PrepItem } from "@/types/ontologyModules";
import { PREP_CATEGORY } from "@/config/ontologyOptions";
import { ItemField } from "./shared/ItemField";
import { AttachmentArea } from "./shared/AttachmentArea";
import { AttributeTagRow } from "./shared/AttributeTagRow";
import { OntologyPicker } from "./shared/OntologyPicker";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(): string {
  return `prep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeBlankPrepItem(): PrepItem {
  return { id: makeId(), name: "", category: PREP_CATEGORY.defaultValue, attributes: [], attachments: [] };
}

// ---------------------------------------------------------------------------
// PrepItemEditCard
// ---------------------------------------------------------------------------

interface EditCardProps {
  draft: PrepItem;
  onChange: (updated: PrepItem) => void;
  onSave: () => void;
  onCancel: () => void;
}

function PrepItemEditCard({ draft, onChange, onSave, onCancel }: EditCardProps) {
  function set<K extends keyof PrepItem>(key: K, value: PrepItem[K]) {
    onChange({ ...draft, [key]: value });
  }

  const canSave = draft.name.trim().length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-medium text-gray-700 truncate">
          {draft.name.trim() || "新准备项"}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-1.5 py-1 rounded"
          >
            <X size={12} /> 取消
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex items-center gap-0.5 text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors font-medium"
          >
            <Check size={12} /> 保存
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <ItemField label="名称" required>
          <Input
            autoFocus
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSave) onSave(); }}
            placeholder="如：丙酮超声清洗、ZnO 靶材预溅射"
            className="h-8 text-sm"
          />
        </ItemField>

        <ItemField label="分类">
          <OntologyPicker
            value={draft.category}
            options={PREP_CATEGORY.options}
            onChange={(v) => set("category", v)}
          />
        </ItemField>

        <ItemField label="属性参数" hint="点击标签修改；回车确认">
          <AttributeTagRow
            tags={draft.attributes}
            onChange={(tags) => set("attributes", tags)}
            keyPlaceholder="参数名"
            valuePlaceholder="值"
          />
        </ItemField>

        <ItemField label="备注">
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="注意事项、替代方案或补充说明…"
            rows={2}
            className="resize-none text-sm"
          />
        </ItemField>

        <AttachmentArea
          attachments={draft.attachments ?? []}
          onChange={(attachments) => set("attachments", attachments)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PrepItemViewCard
// ---------------------------------------------------------------------------

interface ViewCardProps {
  item: PrepItem;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updated: PrepItem) => void;
}

function PrepItemViewCard({ item, onEdit, onDelete, onUpdate }: ViewCardProps) {
  const catColor = PREP_CATEGORY.colors[item.category] ?? "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm group">
      {/* Header row: category badge + name + actions */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onEdit}
          className={[
            "flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap hover:opacity-70 transition-opacity",
            catColor,
          ].join(" ")}
          title="点击编辑"
        >
          {item.category}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
          title="点击编辑"
        >
          {item.name || <span className="text-gray-300 font-normal italic">未命名准备项</span>}
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors" title="编辑">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={onDelete} className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors" title="删除">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Attributes — direct inline edit without entering full edit mode */}
      <div className="px-3 pb-2">
        <AttributeTagRow
          tags={item.attributes}
          onChange={(tags) => onUpdate({ ...item, attributes: tags })}
          keyPlaceholder="参数名"
          valuePlaceholder="值"
        />
      </div>

      {item.description && (
        <button
          type="button"
          onClick={onEdit}
          className="px-3 pb-2.5 text-xs text-gray-400 leading-relaxed text-left hover:text-gray-600 transition-colors w-full"
        >
          {item.description}
        </button>
      )}

      {(item.attachments?.length ?? 0) > 0 && (
        <div className="px-3 pb-2 text-[10px] text-gray-300">
          {item.attachments!.length} 个附件
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PreparationModuleEditor
// ---------------------------------------------------------------------------

interface EditorProps {
  items: PrepItem[];
  onUpdate: (items: PrepItem[]) => void;
}

export function PreparationModuleEditor({ items, onUpdate }: EditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PrepItem | null>(null);
  const [pendingNew, setPendingNew] = useState<PrepItem | null>(null);

  function startEdit(item: PrepItem) {
    setPendingNew(null);
    setEditingId(item.id);
    setEditDraft({ ...item, attributes: [...(item.attributes ?? [])] });
  }

  function saveEdit() {
    if (!editingId || !editDraft) return;
    onUpdate(items.map((p) => (p.id === editingId ? editDraft : p)));
    setEditingId(null);
    setEditDraft(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function startCreate() {
    setEditingId(null);
    setEditDraft(null);
    setPendingNew(makeBlankPrepItem());
  }

  function saveCreate() {
    if (!pendingNew || !pendingNew.name.trim()) return;
    onUpdate([...items, pendingNew]);
    setPendingNew(null);
  }

  function cancelCreate() {
    setPendingNew(null);
  }

  function deleteItem(id: string) {
    if (editingId === id) cancelEdit();
    onUpdate(items.filter((p) => p.id !== id));
  }

  function updateItemDirect(id: string, updated: PrepItem) {
    onUpdate(items.map((p) => (p.id === id ? updated : p)));
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      {items.length === 0 && !pendingNew && (
        <p className="text-xs text-gray-300 py-1 text-center">
          暂无准备项，点击"新增准备项"开始添加
        </p>
      )}

      {items.map((item) =>
        editingId === item.id && editDraft ? (
          <PrepItemEditCard
            key={item.id}
            draft={editDraft}
            onChange={setEditDraft}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        ) : (
          <PrepItemViewCard
            key={item.id}
            item={item}
            onEdit={() => startEdit(item)}
            onDelete={() => deleteItem(item.id)}
            onUpdate={(updated) => updateItemDirect(item.id, updated)}
          />
        ),
      )}

      {pendingNew && (
        <PrepItemEditCard
          draft={pendingNew}
          onChange={setPendingNew}
          onSave={saveCreate}
          onCancel={cancelCreate}
        />
      )}

      <button
        type="button"
        onClick={startCreate}
        className="flex items-center justify-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-gray-400 hover:text-gray-600 transition-colors w-full"
      >
        <Plus size={12} />
        新增准备项
      </button>
    </div>
  );
}
