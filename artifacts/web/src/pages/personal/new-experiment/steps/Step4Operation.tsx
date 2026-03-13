import React from "react";
import { AiFillBanner } from "../AiFillBanner";
import { FieldEditor } from "../fields/FieldEditor";
import type { Step4Data } from "@/types/wizardForm";

interface Props {
  data: Step4Data;
  onChange: (updates: Partial<Step4Data>) => void;
  aiFilled?: boolean;
}

export function Step4Operation({ data, onChange, aiFilled = false }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">实验操作</h1>
        <p className="mt-1 text-sm text-gray-500">
          描述实验的具体操作步骤与安全注意事项，每个步骤可添加时间、参数等属性标签
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
