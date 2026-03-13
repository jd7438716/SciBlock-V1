import React from "react";
import { FieldEditor } from "../fields/FieldEditor";
import type { Step6Data } from "@/types/wizardForm";

interface Props {
  data: Step6Data;
  onChange: (updates: Partial<Step6Data>) => void;
}

export function Step6Data({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">实验数据</h1>
        <p className="mt-1 text-sm text-gray-500">
          记录需要收集的数据项、结果指标及观察内容
        </p>
      </div>

      <FieldEditor
        fields={data.fields}
        onChange={(fields) => onChange({ fields })}
      />
    </div>
  );
}
