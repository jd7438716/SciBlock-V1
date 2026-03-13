import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { ExperimentField } from "@/types/experimentFields";
import { FieldCard } from "./FieldCard";
import { AddFieldForm } from "./AddFieldForm";

interface Props {
  fields: ExperimentField[];
  onChange: (fields: ExperimentField[]) => void;
}

/**
 * FieldEditor — the configurable field-group container for Step 2.
 * Renders a FieldCard per field, plus an inline AddFieldForm triggered by the
 * "新增字段类别" button. All mutations are lifted up via onChange.
 */
export function FieldEditor({ fields, onChange }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);

  function updateField(id: string, updated: ExperimentField) {
    onChange(fields.map((f) => (f.id === id ? updated : f)));
  }

  function deleteField(id: string) {
    onChange(fields.filter((f) => f.id !== id));
  }

  function addField(field: ExperimentField) {
    onChange([...fields, field]);
    setShowAddForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <FieldCard
          key={field.id}
          field={field}
          onChange={(updated) => updateField(field.id, updated)}
          onDelete={() => deleteField(field.id)}
        />
      ))}

      {showAddForm ? (
        <AddFieldForm onAdd={addField} onCancel={() => setShowAddForm(false)} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          <Plus size={14} />
          新增字段类别
        </button>
      )}
    </div>
  );
}
