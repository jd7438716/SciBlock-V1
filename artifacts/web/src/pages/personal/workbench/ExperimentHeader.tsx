import React, { useState, useRef } from "react";
import { Pencil, Sparkles, X } from "lucide-react";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import { ExperimentTitleAssist } from "./ExperimentTitleAssist";
import { StatusPicker } from "./StatusPicker";

/**
 * ExperimentHeader — top section of the OntologyPanel.
 *
 * Contains:
 *   - Editable title with hand-write / AI (Sparkles) icons
 *   - StatusPicker (colored badge dropdown)
 *   - Experiment code input
 *   - Tag input area with add/remove
 *
 * Note: the "+ 新建记录" button has moved to RecordSwitcher.
 */
export function ExperimentHeader() {
  const {
    currentRecord,
    updateTitle,
    updateStatus,
    updateExperimentCode,
    addTag,
    removeTag,
    aiAssistOpen,
    setAiAssistOpen,
  } = useWorkbench();

  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
    if (e.key === "Backspace" && tagInput === "" && currentRecord.tags.length > 0) {
      removeTag(currentRecord.tags[currentRecord.tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">

      {/* Row 1: Title + write / AI icons */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentRecord.title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="实验标题（手写或 AI 生成）"
            className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-gray-200 focus:border-gray-500 pb-0.5 placeholder-gray-300 transition-colors"
          />

          {/* Hand-write icon — visual cue only */}
          <button
            title="手写标题"
            className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-600 transition-colors rounded"
          >
            <Pencil size={13} />
          </button>

          {/* AI assist toggle */}
          <button
            title="AI 辅助生成标题"
            onClick={() => setAiAssistOpen(!aiAssistOpen)}
            className={[
              "flex-shrink-0 p-1 rounded transition-colors",
              aiAssistOpen
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:text-gray-700",
            ].join(" ")}
          >
            <Sparkles size={13} />
          </button>
        </div>

        {/* AI assist popover anchored below the title row */}
        <ExperimentTitleAssist />
      </div>

      {/* Row 2: Status badge + experiment code */}
      <div className="flex items-center gap-2">
        <StatusPicker
          value={currentRecord.experimentStatus}
          onChange={updateStatus}
        />

        <input
          type="text"
          value={currentRecord.experimentCode}
          onChange={(e) => updateExperimentCode(e.target.value)}
          placeholder="实验编号"
          className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none focus:border-gray-400 w-24 font-mono"
        />
      </div>

      {/* Row 3: Tags */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[24px] cursor-text"
        onClick={() => tagInputRef.current?.focus()}
      >
        {currentRecord.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <input
          ref={tagInputRef}
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder={currentRecord.tags.length === 0 ? "添加标签（Enter 确认）" : ""}
          className="flex-1 min-w-[80px] text-xs outline-none bg-transparent text-gray-600 placeholder-gray-300"
        />
      </div>
    </div>
  );
}
