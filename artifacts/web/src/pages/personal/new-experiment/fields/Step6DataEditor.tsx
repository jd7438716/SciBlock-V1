/**
 * Step6DataEditor — wizard card list for 实验数据 (Step 6).
 *
 * Shares DataItemEditCard / DataItemViewCard with the workbench DataModuleEditor.
 * Wizard mode: showAttachments=false (attachments are workbench-only).
 *
 * Write rule: onChange only updates items[]. Never writes to fields.
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { DataItem } from "@/types/ontologyModules";
import {
  DataItemEditCard,
  DataItemViewCard,
} from "@/pages/personal/workbench/modules/shared/DataItemCards";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(): string {
  return `data-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeBlankDataItem(): DataItem {
  return { id: makeId(), name: "", attributes: [] };
}

// ---------------------------------------------------------------------------
// Step6DataEditor
// ---------------------------------------------------------------------------

interface Props {
  items: DataItem[];
  onChange: (items: DataItem[]) => void;
}

export function Step6DataEditor({ items, onChange }: Props) {
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
    onChange(items.map((d) => (d.id === editingId ? editDraft : d)));
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
    onChange([...items, pendingNew]);
    setPendingNew(null);
  }

  function cancelCreate() {
    setPendingNew(null);
  }

  function deleteItem(id: string) {
    if (editingId === id) cancelEdit();
    onChange(items.filter((d) => d.id !== id));
  }

  function updateItemDirect(id: string, updated: DataItem) {
    onChange(items.map((d) => (d.id === id ? updated : d)));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && !pendingNew && (
        <p className="text-sm text-gray-400 py-2 text-center">
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
            showAttachments={false}
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
          showAttachments={false}
        />
      )}

      <button
        type="button"
        onClick={startCreate}
        className="flex items-center justify-center gap-1.5 text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-3 hover:border-gray-400 hover:text-gray-600 transition-colors w-full"
      >
        <Plus size={14} />
        新增数据项
      </button>
    </div>
  );
}
