/**
 * OntologyPicker — recommended-option pills with free-text custom input.
 *
 * Behaviour:
 *  • Renders one pill per recommended option; the pill matching `value` is
 *    highlighted dark.
 *  • If `value` is NOT in `options` (i.e. a custom / inherited value), it is
 *    shown as a selected pill before the recommended list — same visual weight,
 *    no degradation.
 *  • A dashed "+ 自定义" button opens an inline input.
 *    Enter → confirm custom value → onChange(value)
 *    Escape → cancel, input closes without changing value.
 *
 * Consumers only pass `value`, `options`, and `onChange` — they do not own
 * any picker-internal state.
 */

import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";

interface Props {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function OntologyPicker({ value, options, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal]   = useState("");

  const isCustomValue = value !== "" && !options.includes(value);

  function confirm() {
    const v = inputVal.trim();
    if (v) onChange(v);
    setInputVal("");
    setShowInput(false);
  }

  function cancel() {
    setInputVal("");
    setShowInput(false);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Current custom value pill — only rendered when value is not in options */}
      {isCustomValue && (
        <span
          className="inline-flex items-center text-xs px-2.5 py-1 rounded-full border bg-gray-900 text-white border-gray-900"
          title="自定义值（不在推荐列表中）"
        >
          {value}
        </span>
      )}

      {/* Recommended option pills */}
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            value === opt
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}

      {/* Custom input toggle / form */}
      {showInput ? (
        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
          <input
            autoFocus
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  confirm();
              if (e.key === "Escape") cancel();
            }}
            placeholder="自定义…"
            className="w-20 text-xs bg-transparent outline-none text-blue-700 placeholder:text-blue-300"
          />
          <button
            type="button"
            onClick={confirm}
            className="text-green-600 hover:text-green-700 transition-colors"
            title="确认"
          >
            <Check size={10} />
          </button>
          <button
            type="button"
            onClick={cancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="取消"
          >
            <X size={10} />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 bg-transparent border border-dashed border-gray-300 hover:border-gray-400 rounded-full px-2 py-0.5 transition-colors"
        >
          <Plus size={10} />
          自定义
        </button>
      )}
    </div>
  );
}
