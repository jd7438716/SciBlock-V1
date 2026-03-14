import React from "react";
import { AiFillBanner } from "../AiFillBanner";
import { Step3PrepEditor } from "../fields/Step3PrepEditor";
import type { Step3Data } from "@/types/wizardForm";

interface Props {
  data: Step3Data;
  onChange: (updates: Partial<Step3Data>) => void;
  aiFilled?: boolean;
}

export function Step3Preparation({ data, onChange, aiFilled = false }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">实验准备</h1>
        <p className="mt-1 text-sm text-gray-500">
          列出实验所需的材料、设备、环境条件及前处理事项，每项可标注关键参数和备注。
        </p>
      </div>

      {aiFilled && <AiFillBanner />}

      <Step3PrepEditor
        items={data.items}
        onChange={(items) => onChange({ items })}
      />
    </div>
  );
}
