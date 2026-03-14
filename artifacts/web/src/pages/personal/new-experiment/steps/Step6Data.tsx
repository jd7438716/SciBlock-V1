import React from "react";
import { Step6DataEditor } from "../fields/Step6DataEditor";
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
          每条数据项表示一类需要收集或记录的实验数据，可填写属性参数和备注说明。
        </p>
      </div>

      <Step6DataEditor
        items={data.items}
        onChange={(items) => onChange({ items })}
      />
    </div>
  );
}
