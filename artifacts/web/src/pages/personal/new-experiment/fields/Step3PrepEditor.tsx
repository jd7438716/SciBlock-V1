/**
 * Step3PrepEditor — wizard-side list editor for Step 3 (实验准备).
 *
 * Shares PrepItemEditCard / PrepItemViewCard with the workbench
 * PreparationModuleEditor. Key difference: showAttachments=false
 * (attachments are not relevant at the planning stage).
 *
 * Write rule: only ever writes to Step3Data.items[].
 * Legacy Step3Data.fields is never touched here.
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { PrepItem } from "@/types/ontologyModules";
import { PREP_CATEGORY } from "@/config/ontologyOptions";
import {
  PrepItemEditCard,
  PrepItemViewCard,
} from "@/pages/personal/workbench/modules/shared/PrepItemCards";

function makeId(): string {
  return `prep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeBlankPrepItem(): PrepItem {
  return {
    id: makeId(),
    name: "",
    category: PREP_CATEGORY.defaultValue,
    attributes: [],
    attachments: [],
  };
}

interface Props {
  items: PrepItem[];
  onChange: (items: PrepItem[]) => void;
}

export function Step3PrepEditor({ items, onChange }: Props) {
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
    onChange(items.map((p) => (p.id === editingId ? editDraft : p)));
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
    onChange([...items, pendingNew]);
    setPendingNew(null);
  }

  function cancelCreate() {
    setPendingNew(null);
  }

  function deleteItem(id: string) {
    if (editingId === id) cancelEdit();
    onChange(items.filter((p) => p.id !== id));
  }

  function updateItemDirect(id: string, updated: PrepItem) {
    onChange(items.map((p) => (p.id === id ? updated : p)));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && !pendingNew && (
        <p className="text-sm text-gray-400 py-2 text-center">
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
            showAttachments={false}
          />
        ) : (
          <PrepItemViewCard
            key={item.id}
            item={item}
            onEdit={() => startEdit(item)}
            onDelete={() => deleteItem(item.id)}
            onUpdate={(updated) => updateItemDirect(item.id, updated)}
            showAttachments={false}
          />
        ),
      )}

      {pendingNew && (
        <PrepItemEditCard
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
        className="flex items-center justify-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-gray-400 hover:text-gray-600 transition-colors w-full"
      >
        <Plus size={12} />
        新增准备项
      </button>
    </div>
  );
}
