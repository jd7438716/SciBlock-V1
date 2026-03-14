import React, { useState, useEffect } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import type { OntologyModule } from "@/types/workbench";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import { SystemModuleView } from "./modules/SystemModuleView";
import { PreparationModuleView } from "./modules/PreparationModuleView";
import { OperationModuleView } from "./modules/OperationModuleView";
import { MeasurementModuleView } from "./modules/MeasurementModuleView";
import { DataModuleView } from "./modules/DataModuleView";

// ---------------------------------------------------------------------------
// Structured content dispatcher
// ---------------------------------------------------------------------------

/**
 * StructuredModuleView — selects the correct view component based on module key.
 * Rendered in inherited / confirmed states.
 * Falls back to a plain pre-wrap text block when structuredData is absent
 * (e.g. legacy records created before structured data was introduced).
 */
function StructuredModuleView({
  module,
  onAdd,
}: {
  module: OntologyModule;
  onAdd: () => void;
}) {
  const sd = module.structuredData;

  if (module.key === "system") {
    const objects = sd?.systemObjects ?? [];
    return <SystemModuleView objects={objects} onAdd={onAdd} />;
  }

  if (module.key === "preparation") {
    const items = sd?.prepItems ?? [];
    return <PreparationModuleView items={items} onAdd={onAdd} />;
  }

  if (module.key === "operation") {
    const steps = sd?.operationSteps ?? [];
    return <OperationModuleView steps={steps} onAdd={onAdd} />;
  }

  if (module.key === "measurement") {
    const items = sd?.measurementItems ?? [];
    return <MeasurementModuleView items={items} onAdd={onAdd} />;
  }

  if (module.key === "data") {
    const items = sd?.dataItems ?? [];
    return <DataModuleView items={items} onAdd={onAdd} />;
  }

  // Fallback — should not reach here with a valid key
  return (
    <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
      {module.content || (
        <span className="text-gray-300 italic">暂无内容，点击"编辑"填写</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OntologyModuleEditor
// ---------------------------------------------------------------------------

interface Props {
  module: OntologyModule;
}

/**
 * OntologyModuleEditor — displays and edits a single ontology module.
 *
 * State machine (one-way except edit → inherited on cancel):
 *   inherited → confirmed  (直接确认继承内容，无需编辑)
 *   inherited → editing    (先编辑再确认)
 *   editing   → confirmed  (保存编辑内容并确认)
 *   editing   → inherited  (取消，内容恢复)
 *   confirmed → editing    (再次编辑，状态回到 editing)
 *
 * View states (inherited / confirmed) now render structured card/list panels
 * via StructuredModuleView. The editing state retains a plain textarea.
 *
 * Highlight: isHighlighted=true → faint amber ring (AI flagged this module)
 */
export function OntologyModuleEditor({ module }: Props) {
  const { updateModuleContent, setModuleStatus } = useWorkbench();

  const [draft, setDraft] = useState(module.content);

  // Sync draft when switching to a different module or record
  useEffect(() => {
    setDraft(module.content);
  }, [module.key, module.content]);

  const isEditing   = module.status === "editing";
  const isConfirmed = module.status === "confirmed";
  const isInherited = module.status === "inherited";

  function handleEditClick() {
    setModuleStatus(module.key, "editing");
  }

  function handleEditConfirm() {
    updateModuleContent(module.key, draft);
    setModuleStatus(module.key, "confirmed");
  }

  function handleDirectConfirm() {
    setModuleStatus(module.key, "confirmed");
  }

  function handleCancelEdit() {
    setDraft(module.content);
    setModuleStatus(module.key, "inherited");
  }

  function handleReEdit() {
    setModuleStatus(module.key, "editing");
  }

  return (
    <div
      className={[
        "flex flex-col h-full",
        module.isHighlighted ? "ring-2 ring-amber-300 ring-inset" : "",
      ].join(" ")}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{module.title}</h3>
          {module.isHighlighted && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              AI 关联
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isConfirmed && (
            <>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={13} />
                已确认
              </span>
              <button
                onClick={handleReEdit}
                className="text-xs text-gray-300 hover:text-gray-600 transition-colors ml-1"
                title="重新编辑"
              >
                <Pencil size={11} />
              </button>
            </>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleCancelEdit}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-0.5 rounded"
              >
                取消
              </button>
              <button
                onClick={handleEditConfirm}
                className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 transition-colors font-medium"
              >
                确认
              </button>
            </>
          )}

          {isInherited && (
            <>
              <button
                onClick={handleEditClick}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Pencil size={12} />
                编辑
              </button>
              <button
                onClick={handleDirectConfirm}
                className="text-xs border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 px-2 py-0.5 rounded transition-colors"
              >
                确认
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={[
          "flex-1 overflow-y-auto",
          isEditing   ? "bg-amber-50" : "",
          isConfirmed ? "bg-white"    : "",
          isInherited ? "bg-gray-50"  : "",
        ].join(" ")}
      >
        {isEditing ? (
          /* Editing state: plain textarea (fast, reliable, accepts any format) */
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full min-h-[200px] px-4 py-3 text-sm text-gray-700 leading-relaxed resize-none outline-none bg-amber-50 border-0 font-mono"
            placeholder="输入模块内容…"
            autoFocus
          />
        ) : (
          /* View state (inherited / confirmed): structured card / list panel */
          <StructuredModuleView module={module} onAdd={handleEditClick} />
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer badge                                                        */}
      {/* ------------------------------------------------------------------ */}
      {isInherited && (
        <div className="px-4 py-1.5 border-t border-gray-100 bg-white flex-shrink-0">
          <span className="text-xs text-gray-300">继承自本体版本，尚未确认</span>
        </div>
      )}
    </div>
  );
}
