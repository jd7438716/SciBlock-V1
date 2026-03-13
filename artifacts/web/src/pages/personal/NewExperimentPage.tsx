import React, { useState } from "react";
import { StepNav } from "./new-experiment/StepNav";
import { Step1References } from "./new-experiment/steps/Step1References";
import { PLACEHOLDER_REFERENCES } from "@/data/experimentReferences";
import type { ImportedFile } from "@/types/experiment";

/**
 * Rendered inside AuthenticatedLayout — the sidebar is already present.
 * This page owns the wizard layout: step nav on the left, content on the right.
 */
export function NewExperimentPage() {
  const [activeStepId, setActiveStepId] = useState(1);
  const [references, setReferences] = useState<ImportedFile[]>(
    PLACEHOLDER_REFERENCES,
  );

  function handleRemoveFile(id: string) {
    setReferences((prev) => prev.filter((f) => f.id !== id));
  }

  function handleAnalyze() {
    // TODO: trigger AI analysis when backend is ready
    console.log("Analyze requested for", references.length, "files");
  }

  function handleFinish() {
    // TODO: navigate to the created SciNote
    console.log("Finish initialization");
  }

  function renderStepContent() {
    switch (activeStepId) {
      case 1:
        return (
          <Step1References
            files={references}
            onRemoveFile={handleRemoveFile}
            onAnalyze={handleAnalyze}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-gray-400">
              步骤 {activeStepId} 内容开发中
            </p>
          </div>
        );
    }
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Wizard step navigation */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col px-4 py-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-1">
          初始化步骤
        </p>
        <StepNav
          activeStepId={activeStepId}
          onStepClick={setActiveStepId}
          canFinish={false}
          onFinish={handleFinish}
        />
      </aside>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto px-10 py-10 bg-gray-50">
        {renderStepContent()}
      </main>
    </div>
  );
}
