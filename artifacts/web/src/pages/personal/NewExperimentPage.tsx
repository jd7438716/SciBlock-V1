import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { StepNav } from "./new-experiment/StepNav";
import { Step1References } from "./new-experiment/steps/Step1References";
import { PLACEHOLDER_REFERENCES } from "@/data/experimentReferences";
import type { ImportedFile } from "@/types/experiment";

export function NewExperimentPage() {
  const [activeStepId, setActiveStepId] = useState(1);
  const [references, setReferences] = useState<ImportedFile[]>(PLACEHOLDER_REFERENCES);

  function handleRemoveFile(id: string) {
    setReferences((prev) => prev.filter((f) => f.id !== id));
  }

  function handleAnalyze() {
    // TODO: trigger AI analysis when backend is ready
    console.log("Analyze requested for", references.length, "files");
  }

  function handleFinish() {
    // TODO: navigate to the created SciNote when wired up
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
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-sm text-gray-400">步骤 {activeStepId} 内容开发中</p>
          </div>
        );
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left panel — step navigation */}
      <aside className="w-64 flex-shrink-0 h-screen bg-gray-50 border-r border-gray-100 flex flex-col px-4 py-6">
        {/* Back link */}
        <Link
          href="/home"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          返回主页
        </Link>

        {/* Label */}
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

      {/* Right panel — step content */}
      <main className="flex-1 overflow-y-auto px-10 py-10">
        {renderStepContent()}
      </main>
    </div>
  );
}
