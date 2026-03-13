import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { StepNav } from "./new-experiment/StepNav";
import { StepFooter } from "./new-experiment/StepFooter";
import { Step1Choice } from "./new-experiment/steps/Step1Choice";
import { Step1References } from "./new-experiment/steps/Step1References";
import { Step2System } from "./new-experiment/steps/Step2System";
import { Step3Preparation } from "./new-experiment/steps/Step3Preparation";
import { Step4Operation } from "./new-experiment/steps/Step4Operation";
import { Step5Measurement } from "./new-experiment/steps/Step5Measurement";
import { Step6Data } from "./new-experiment/steps/Step6Data";
import { useReferences } from "@/hooks/useReferences";
import { useWizardForm } from "@/hooks/useWizardForm";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useNewExperimentDraft } from "@/contexts/NewExperimentDraftContext";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { getExperimentName } from "@/types/experimentFields";
import { AI_MOCK_FILL } from "@/data/aiMockFill";

const TOTAL_STEPS = 6;

type Step1Path = "choice" | "uploading";

export function NewExperimentPage() {
  const [activeStepId, setActiveStepId] = useState(1);
  const [step1Path, setStep1Path] = useState<Step1Path>("choice");

  const refs = useReferences([]);
  const form = useWizardForm();

  const [, navigate] = useLocation();
  const { createSciNote } = useSciNoteStore();
  const { setDraftName } = useNewExperimentDraft();

  // Guard so form is populated only once.
  const hasPopulated = useRef(false);

  // Sequential AI analysis flow — starts when user clicks "开始分析".
  // onComplete fires after all steps 1–5 reach "generated".
  const aiAnalysis = useAiAnalysis({
    onComplete: () => {
      if (!hasPopulated.current) {
        hasPopulated.current = true;
        form.populateFromAI(AI_MOCK_FILL);
      }
    },
  });

  // Publish experiment name to sidebar in real time.
  const experimentName = getExperimentName(form.data.step2.fields);
  useEffect(() => {
    setDraftName(experimentName);
  }, [experimentName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remove the sidebar draft entry when leaving the page.
  useEffect(() => {
    return () => {
      setDraftName(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function goToStep(stepId: number) {
    if (stepId < 1 || stepId > TOTAL_STEPS) return;
    if (stepId === 1) setStep1Path("choice");

    // Transition "generated" → "reviewed" when user visits the step.
    aiAnalysis.markReviewed(stepId);

    setActiveStepId(stepId);
  }

  function handleChooseUpload() {
    setStep1Path("uploading");
  }

  function handleSkip() {
    goToStep(2);
  }

  /**
   * Triggered by "开始分析" button in Step1References.
   * - refs.analyze()     → drives file-item status UI (pending → analyzing → done)
   * - aiAnalysis.start() → drives the step-nav sequential progress
   */
  function handleAnalyze() {
    refs.analyze();
    aiAnalysis.start();
  }

  function handleFinish() {
    const id = createSciNote(form.data);
    navigate(`/personal/experiment/${id}`);
  }

  function renderStepContent() {
    switch (activeStepId) {
      case 1:
        if (step1Path === "choice") {
          return (
            <Step1Choice
              onChooseUpload={handleChooseUpload}
              onSkip={handleSkip}
            />
          );
        }
        return (
          <Step1References
            files={refs.files}
            onAddFiles={refs.addFiles}
            onRemoveFile={refs.removeFile}
            onAnalyze={handleAnalyze}
            canAnalyze={refs.canAnalyze}
            isAnalyzing={aiAnalysis.isRunning}
            analysisComplete={aiAnalysis.isComplete}
            onProceed={() => goToStep(2)}
          />
        );

      case 2:
        return (
          <Step2System
            data={form.data.step2}
            onChange={(u) => form.patch("step2", u)}
            aiFilled={form.isAiFilled}
          />
        );

      case 3:
        return (
          <Step3Preparation
            data={form.data.step3}
            onChange={(u) => form.patch("step3", u)}
            aiFilled={form.isAiFilled}
          />
        );

      case 4:
        return (
          <Step4Operation
            data={form.data.step4}
            onChange={(u) => form.patch("step4", u)}
            aiFilled={form.isAiFilled}
          />
        );

      case 5:
        return (
          <Step5Measurement
            data={form.data.step5}
            onChange={(u) => form.patch("step5", u)}
            aiFilled={form.isAiFilled}
          />
        );

      case 6:
        return (
          <Step6Data
            data={form.data.step6}
            onChange={(u) => form.patch("step6", u)}
          />
        );

      default:
        return null;
    }
  }

  const showFooter = activeStepId >= 2;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Wizard step navigation */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col px-4 py-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-1">
          初始化步骤
        </p>
        <StepNav
          activeStepId={activeStepId}
          onStepClick={goToStep}
          canFinish={form.canFinish}
          onFinish={handleFinish}
          aiStatuses={aiAnalysis.statuses}
        />
      </aside>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex flex-col min-h-full px-10 py-10">
          <div className="flex-1">{renderStepContent()}</div>

          {showFooter && (
            <StepFooter
              stepId={activeStepId}
              totalSteps={TOTAL_STEPS}
              onPrev={() => goToStep(activeStepId - 1)}
              onNext={() => goToStep(activeStepId + 1)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
