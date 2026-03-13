import React from "react";
import { Step1Choice } from "./steps/Step1Choice";
import { Step1References } from "./steps/Step1References";
import { Step2System } from "./steps/Step2System";
import { Step3Preparation } from "./steps/Step3Preparation";
import { Step4Operation } from "./steps/Step4Operation";
import { Step5Measurement } from "./steps/Step5Measurement";
import { Step6Data } from "./steps/Step6Data";
import type { UseExperimentWizardResult } from "@/hooks/useExperimentWizard";

interface Props {
  wizard: UseExperimentWizardResult;
}

/**
 * WizardStepContent — renders the content area for the active wizard step.
 *
 * Receives the full wizard result object so callers don't need to destructure
 * every individual piece before passing it down.
 */
export function WizardStepContent({ wizard }: Props) {
  const {
    activeStepId,
    step1Path,
    form,
    refs,
    aiAnalysis,
    goToStep,
    handleChooseUpload,
    handleAnalyze,
  } = wizard;

  switch (activeStepId) {
    case 1:
      return step1Path === "choice" ? (
        <Step1Choice
          onChooseUpload={handleChooseUpload}
          onSkip={() => goToStep(2)}
        />
      ) : (
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
