/**
 * ModuleSectionCard — collapsible section card for one ontology module.
 *
 * Layer: UI component (reads + writes WorkbenchContext).
 *
 * Responsibilities:
 *   - Collapse / expand the module body
 *   - Show module title, item count badge, empty-state hint, status chip
 *   - Delegate content rendering to ModuleBodyRenderer (no duplication)
 *   - Sync left-panel navigation: clicking the header calls setActiveModuleKey
 *   - Accept a `sectionRef` callback so the parent can scrollIntoView on nav change
 *   - Provide confirm / reopen buttons (same semantics as OntologyModuleEditor)
 *
 * Does NOT manage its own edit/save/cancel — that responsibility stays inside
 * each module editor component (PrepItemCards, OperationStepCards, etc.) which
 * already implement item-level inline editing with save and cancel.
 */

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Pencil } from "lucide-react";
import type { OntologyModule, OntologyModuleKey } from "@/types/workbench";
import type { OntologyModuleStructuredData } from "@/types/ontologyModules";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import { ModuleBodyRenderer } from "../modules/shared/ModuleBodyRenderer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count the items in a module's structured data. */
function getItemCount(module: OntologyModule): number {
  const sd = module.structuredData ?? {};
  switch (module.key) {
    case "system":      return sd.systemObjects?.length ?? 0;
    case "preparation": return sd.prepItems?.length ?? 0;
    case "operation":   return sd.operationSteps?.length ?? 0;
    case "measurement": return sd.measurementItems?.length ?? 0;
    case "data":        return sd.dataItems?.length ?? 0;
    default:            return 0;
  }
}

// ---------------------------------------------------------------------------
// ModuleSectionCard
// ---------------------------------------------------------------------------

interface Props {
  module: OntologyModule;
  /** True when this module is selected in the left OntologyModuleNav. */
  isActive: boolean;
  /**
   * Callback ref so the EditorPanel can scroll this element into view when
   * the user selects this module from the left navigation.
   */
  sectionRef: (el: HTMLDivElement | null) => void;
}

export function ModuleSectionCard({ module, isActive, sectionRef }: Props) {
  const { updateModuleStructuredData, setModuleStatus, setActiveModuleKey } =
    useWorkbench();

  const itemCount = getItemCount(module);
  const isConfirmed = module.status === "confirmed";
  const isHighlighted = module.isHighlighted;

  // Start expanded when: module has items OR is the active module
  const [expanded, setExpanded] = useState(() => itemCount > 0 || isActive);

  // Auto-expand when the left nav activates this module
  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleHeaderClick() {
    setActiveModuleKey(module.key as OntologyModuleKey);
    setExpanded((v) => !v);
  }

  function handleUpdate(patch: Partial<OntologyModuleStructuredData>) {
    const sd = module.structuredData ?? {};
    updateModuleStructuredData(module.key, { ...sd, ...patch });
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setModuleStatus(module.key, "confirmed");
  }

  function handleReopen(e: React.MouseEvent) {
    e.stopPropagation();
    setModuleStatus(module.key, "inherited");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={sectionRef}
      className={[
        "border rounded-xl bg-white overflow-hidden transition-all",
        isActive
          ? "border-violet-200 shadow-sm"
          : "border-gray-100 hover:border-gray-200",
        isHighlighted ? "ring-2 ring-amber-200" : "",
      ].join(" ")}
    >
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
        onClick={handleHeaderClick}
      >
        {/* Collapse chevron */}
        {expanded
          ? <ChevronDown  size={14} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}

        {/* Module title */}
        <h3 className="flex-1 text-sm font-medium text-gray-800">
          {module.title}
        </h3>

        {/* AI-highlight badge */}
        {isHighlighted && (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
            AI 关联
          </span>
        )}

        {/* Item count */}
        {itemCount > 0 ? (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
            {itemCount} 项
          </span>
        ) : (
          <span className="text-[10px] text-gray-300 italic flex-shrink-0">
            待补充
          </span>
        )}

        {/* Status: confirmed chip + reopen OR confirm button */}
        {isConfirmed ? (
          <>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium flex-shrink-0">
              <CheckCircle2 size={11} />
              已确认
            </span>
            <button
              onClick={handleReopen}
              className="text-gray-300 hover:text-gray-500 p-0.5 rounded transition-colors flex-shrink-0"
              title="撤销确认，继续编辑"
            >
              <Pencil size={10} />
            </button>
          </>
        ) : (
          <button
            onClick={handleConfirm}
            className="text-[10px] border border-gray-200 text-gray-400 hover:border-gray-500 hover:text-gray-700 px-2 py-0.5 rounded transition-colors flex-shrink-0"
          >
            确认
          </button>
        )}
      </div>

      {/* ── Section body (visible when expanded) ───────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-50">
          {itemCount === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-300 italic text-center">
              暂无数据，点击下方按钮开始添加
            </div>
          ) : null}
          <ModuleBodyRenderer module={module} onUpdate={handleUpdate} />
        </div>
      )}
    </div>
  );
}
