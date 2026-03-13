import { useState, useRef } from "react";
import { useReferences } from "./useReferences";
import { useWizardForm, type UseWizardFormResult } from "./useWizardForm";
import { useAiAnalysis, type UseAiAnalysisResult } from "./useAiAnalysis";
import { AI_MOCK_FILL } from "@/data/aiMockFill";
import type { UseReferencesResult } from "./useReferences";

export type Step1Path = "choice" | "uploading";

export const WIZARD_TOTAL_STEPS = 6;

export interface UseExperimentWizardResult {
  activeStepId: number;
  step1Path: Step1Path;
  form: UseWizardFormResult;
  refs: UseReferencesResult;
  aiAnalysis: UseAiAnalysisResult;
  goToStep: (stepId: number) => void;
  handleChooseUpload: () => void;
  handleAnalyze: () => void;
}

/**
 * Encapsulates all state and handlers shared by the "new experiment" and
 * "reinitialize experiment" wizard flows.
 *
 * Pages that use this hook only need to supply their own `onFinish` logic
 * (create vs. overwrite) and any page-specific side-effects (e.g. draft name
 * sync for the new-experiment flow).
 */
export function useExperimentWizard(): UseExperimentWizardResult {
  const [activeStepId, setActiveStepId] = useState(1);
  const [step1Path, setStep1Path] = useState<Step1Path>("choice");

  const refs = useReferences([]);
  const form = useWizardForm();
  const hasPopulated = useRef(false);

  const aiAnalysis = useAiAnalysis({
    onComplete: () => {
      if (!hasPopulated.current) {
        hasPopulated.current = true;
        form.populateFromAI(AI_MOCK_FILL);
      }
    },
  });

  function goToStep(stepId: number) {
    if (stepId < 1 || stepId > WIZARD_TOTAL_STEPS) return;
    if (stepId === 1) setStep1Path("choice");
    aiAnalysis.markReviewed(stepId);
    setActiveStepId(stepId);
  }

  function handleChooseUpload() {
    setStep1Path("uploading");
  }

  function handleAnalyze() {
    refs.analyze();
    aiAnalysis.start();
  }

  return {
    activeStepId,
    step1Path,
    form,
    refs,
    aiAnalysis,
    goToStep,
    handleChooseUpload,
    handleAnalyze,
  };
}
