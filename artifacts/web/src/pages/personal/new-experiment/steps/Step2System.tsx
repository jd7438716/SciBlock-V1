import React from "react";
import { AiFillBanner } from "../AiFillBanner";
import { FieldEditor } from "../fields/FieldEditor";
import type { Step2Data } from "@/types/wizardForm";

interface Props {
  data: Step2Data;
  onChange: (updates: Partial<Step2Data>) => void;
  aiFilled?: boolean;
}

/**
 * Step 2 — 实验系统
 *
 * Renders a configurable field-group editor. Each field category is an independent
 * card the user can edit, delete, or rearrange. New categories can be added via the
 * inline "新增字段类别" form at the bottom.
 *
 * AI-extracted content arrives as ExperimentField[] and is rendered into the same
 * structure — the user can then prune or augment it freely.
 */
export function Step2System({ data, onChange, aiFilled = false }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">实验系统</h1>
        <p className="mt-1 text-sm text-gray-500">
          配置本次实验的字段类别。可新增、删除字段类别，也可直接编辑内容。
        </p>
      </div>

      {aiFilled && <AiFillBanner />}

      <FieldEditor
        fields={data.fields}
        onChange={(fields) => onChange({ fields })}
      />
    </div>
  );
}
