import React from "react";
import { AiFillBanner } from "../AiFillBanner";
import { FieldEditor } from "../fields/FieldEditor";
import type { Step2Data } from "@/types/wizardForm";
import type { ExperimentField } from "@/types/experimentFields";

interface Props {
  data: Step2Data;
  onChange: (updates: Partial<Step2Data>) => void;
  aiFilled?: boolean;
}

// The three standard experiment-level metadata field names.
// They live in the fixed section and are not deletable.
const META_NAMES = ["实验名称", "实验类型", "实验目标"] as const;
type MetaName = (typeof META_NAMES)[number];

const META_LABELS: Record<MetaName, string> = {
  实验名称: "实验名称",
  实验类型: "实验类型",
  实验目标: "实验目标",
};

const META_PLACEHOLDERS: Record<MetaName, string> = {
  实验名称: "例：二维材料光学性质表征实验",
  实验类型: "例：材料表征 / 催化性能测试 / 光学表征",
  实验目标: "例：验证功能化纳米粒子在目标催化反应中的转化效率",
};

/**
 * Step 2 — 实验系统
 *
 * Two distinct sections:
 *
 *  ┌─ 实验基本信息 ─────────────────────────────┐
 *  │  实验名称 / 实验类型 / 实验目标 (fixed form) │
 *  └─────────────────────────────────────────────┘
 *  ┌─ 实验系统对象（可选）────────────────────────┐
 *  │  FieldEditor — user-added objects such as    │
 *  │  研究对象, 实验仪器, 实验材料, etc.           │
 *  └─────────────────────────────────────────────┘
 *
 * The three standard metadata fields are stored in fields[] exactly as before
 * (same Step2Data shape) so that all downstream consumers are unaffected.
 * They are rendered as simple labeled inputs instead of collapsible FieldCards.
 */
export function Step2System({ data, onChange, aiFilled = false }: Props) {
  const { fields } = data;

  // ── helpers ──────────────────────────────────────────────────────────────

  function getMetaValue(name: MetaName): string {
    return fields.find((f) => f.name === name)?.value ?? "";
  }

  function setMetaValue(name: MetaName, value: string) {
    const next = fields.map((f) => (f.name === name ? { ...f, value } : f));
    onChange({ fields: next });
  }

  // Non-meta fields (user-added objects and any AI-injected extra fields)
  const objectFields: ExperimentField[] = fields.filter(
    (f) => !(META_NAMES as readonly string[]).includes(f.name),
  );

  function handleObjectFieldsChange(updated: ExperimentField[]) {
    const metaFields = fields.filter((f) =>
      (META_NAMES as readonly string[]).includes(f.name),
    );
    onChange({ fields: [...metaFields, ...updated] });
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">实验系统</h1>
        <p className="mt-1 text-sm text-gray-500">
          填写实验基本信息，并可选添加研究对象或实验仪器等系统对象。
        </p>
      </div>

      {aiFilled && <AiFillBanner />}

      {/* ── Section A: fixed experiment metadata ── */}
      <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          实验基本信息
        </p>

        {(META_NAMES as readonly MetaName[]).map((name) => (
          <div key={name} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {META_LABELS[name]}
            </label>
            {name === "实验目标" ? (
              <textarea
                rows={2}
                value={getMetaValue(name)}
                onChange={(e) => setMetaValue(name, e.target.value)}
                placeholder={META_PLACEHOLDERS[name]}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors"
              />
            ) : (
              <input
                type="text"
                value={getMetaValue(name)}
                onChange={(e) => setMetaValue(name, e.target.value)}
                placeholder={META_PLACEHOLDERS[name]}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Section B: user-added system objects (optional) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            实验系统对象 <span className="font-normal normal-case">（可选）</span>
          </p>
          <p className="text-xs text-gray-400">
            添加研究基底、仪器、试剂或其他实验对象，将在工作台本体树中以独立条目呈现。
          </p>
        </div>

        <FieldEditor
          fields={objectFields}
          onChange={handleObjectFieldsChange}
        />
      </div>
    </div>
  );
}
