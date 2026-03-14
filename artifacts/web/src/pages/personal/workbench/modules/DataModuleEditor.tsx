/**
 * DataModuleEditor — per-item inline editing for the 实验数据 module.
 *
 * Aligned with SystemModuleEditor / PreparationModuleEditor / etc.:
 *  - attributes: Tag[] — structured key:value (单位, 数据类型, 采样点…)
 *  - VIEW card: name (click-to-edit) + AttributeTagRow (direct edit) + description
 *  - EDIT card: name, AttributeTagRow, description textarea, attachments
 *  - editingId + editDraft + pendingNew pattern; one item editable at a time
 */

import React, { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DataItem } from "@/types/ontologyModules";
import { ItemField } from "./shared/ItemField";
import { AttachmentArea } from "./shared/AttachmentArea";
import { AttributeTagRow } from "./shared/AttributeTagRow";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(): string {
  return `data-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeBlankDataItem(): DataItem {
  return { id: makeId(), name: "", attributes: [], attachments: [] };
}

// ---------------------------------------------------------------------------
// DataItemEditCard
// ---------------------------------------------------------------------------

interface EditCardProps {
  draft: DataItem;
  onChange: (updated: DataItem) => void;
  onSave: () => void;
  onCancel: () => void;
}

function DataItemEditCard({ draft, onChange, onSave, onCancel }: EditCardProps) {
  function set<K extends keyof DataItem>(key: K, value: DataItem[K]) {
    onChange({ ...draft, [key]: value });
  }

  const canSave = draft.name.trim().length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-medium text-gray-700 truncate">
          {draft.name.trim() || "新数据项"}
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
        <ItemField label="数据名称" required>
          <Input
            autoFocus
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSave) onSave(); }}
            placeholder="如：吸光度、薄膜厚度、载流子浓度"
            className="h-8 text-sm"
          />
        </ItemField>

        <ItemField label="属性" hint="点击标签修改；回车确认">
          <AttributeTagRow
            tags={draft.attributes}
            onChange={(tags) => set("attributes", tags)}
            keyPlaceholder="属性名"
            valuePlaceholder="值"
            addLabel="属性"
          />
        </ItemField>

        <ItemField label="备注 / 说明">
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="数据来源、处理方法或补充说明…"
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
// DataItemViewCard
// ---------------------------------------------------------------------------

interface ViewCardProps {
  item: DataItem;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updated: DataItem) => void;
}

function DataItemViewCard({ item, onEdit, onDelete, onUpdate }: ViewCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm group">
      {/* Header row: name + actions */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-blue-700 transition-colors leading-snug min-w-0 truncate"
          title="点击编辑"
        >
          {item.name || <span className="text-gray-300 font-normal italic">未命名数据项</span>}
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
            title="编辑"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            title="删除"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Attributes — direct inline key:value edit without entering full edit mode */}
      <div className="px-3 pb-2">
        <AttributeTagRow
          tags={item.attributes}
          onChange={(tags) => onUpdate({ ...item, attributes: tags })}
          keyPlaceholder="属性名"
          valuePlaceholder="值"
          addLabel="属性"
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
// DataModuleEditor
// ---------------------------------------------------------------------------

interface EditorProps {
  items: DataItem[];
  onUpdate: (items: DataItem[]) => void;
}

export function DataModuleEditor({ items, onUpdate }: EditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DataItem | null>(null);
  const [pendingNew, setPendingNew] = useState<DataItem | null>(null);

  function startEdit(item: DataItem) {
    setPendingNew(null);
    setEditingId(item.id);
    setEditDraft({ ...item, attributes: [...(item.attributes ?? [])] });
  }

  function saveEdit() {
    if (!editingId || !editDraft) return;
    onUpdate(items.map((d) => (d.id === editingId ? editDraft : d)));
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
    setPendingNew(makeBlankDataItem());
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
    onUpdate(items.filter((d) => d.id !== id));
  }

  function updateItemDirect(id: string, updated: DataItem) {
    onUpdate(items.map((d) => (d.id === id ? updated : d)));
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      {items.length === 0 && !pendingNew && (
        <p className="text-xs text-gray-300 py-1 text-center">
          暂无数据项，点击"新增数据项"开始添加
        </p>
      )}

      {items.map((item) =>
        editingId === item.id && editDraft ? (
          <DataItemEditCard
            key={item.id}
            draft={editDraft}
            onChange={setEditDraft}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        ) : (
          <DataItemViewCard
            key={item.id}
            item={item}
            onEdit={() => startEdit(item)}
            onDelete={() => deleteItem(item.id)}
            onUpdate={(updated) => updateItemDirect(item.id, updated)}
          />
        ),
      )}

      {pendingNew && (
        <DataItemEditCard
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
        新增数据项
      </button>
    </div>
  );
}
