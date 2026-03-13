import React from "react";
import { AiFillBanner } from "../AiFillBanner";
import { FieldEditor } from "../fields/FieldEditor";
import type { Step5Data } from "@/types/wizardForm";

interface Props {
  data: Step5Data;
  onChange: (updates: Partial<Step5Data>) => void;
  aiFilled?: boolean;
}

export function Step5Measurement({ data, onChange, aiFilled = false }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">测量过程</h1>
        <p className="mt-1 text-sm text-gray-500">
          定义测量方法、测量对象、条件及所用仪器，每项可挂载属性标签
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
