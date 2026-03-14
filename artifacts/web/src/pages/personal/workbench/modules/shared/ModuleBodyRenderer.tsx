/**
 * ModuleBodyRenderer — dispatches a module to its typed editor component.
 *
 * Layer: Shared UI component (no context reads, pure props).
 *
 * Extracted from OntologyModuleEditor so that both OntologyPanel (left) and
 * EditorPanel (middle/right) can render module content without duplication.
 *
 * Used by:
 *   OntologyModuleEditor  → left-panel single-module view
 *   ModuleSectionCard     → right-panel scrollable section cards
 */

import React from "react";
import type { OntologyModule } from "@/types/workbench";
import type { OntologyModuleStructuredData } from "@/types/ontologyModules";
import { SystemModuleEditor } from "../SystemModuleEditor";
import { PreparationModuleEditor } from "../PreparationModuleEditor";
import { OperationModuleEditor } from "../OperationModuleEditor";
import { MeasurementModuleEditor } from "../MeasurementModuleEditor";
import { DataModuleEditor } from "../DataModuleEditor";

interface Props {
  module: OntologyModule;
  /** Incremental updater — caller merges patch and persists. */
  onUpdate: (patch: Partial<OntologyModuleStructuredData>) => void;
}

export function ModuleBodyRenderer({ module, onUpdate }: Props) {
  const sd = module.structuredData ?? {};

  switch (module.key) {
    case "system":
      return (
        <SystemModuleEditor
          objects={sd.systemObjects ?? []}
          onUpdate={(objects) => onUpdate({ systemObjects: objects })}
        />
      );
    case "preparation":
      return (
        <PreparationModuleEditor
          items={sd.prepItems ?? []}
          onUpdate={(items) => onUpdate({ prepItems: items })}
        />
      );
    case "operation":
      return (
        <OperationModuleEditor
          steps={sd.operationSteps ?? []}
          onUpdate={(steps) => onUpdate({ operationSteps: steps })}
        />
      );
    case "measurement":
      return (
        <MeasurementModuleEditor
          items={sd.measurementItems ?? []}
          onUpdate={(items) => onUpdate({ measurementItems: items })}
        />
      );
    case "data":
      return (
        <DataModuleEditor
          items={sd.dataItems ?? []}
          onUpdate={(items) => onUpdate({ dataItems: items })}
        />
      );
    default:
      return (
        <div className="px-4 py-3 text-sm text-gray-400 italic">
          模块内容暂未配置
        </div>
      );
  }
}
