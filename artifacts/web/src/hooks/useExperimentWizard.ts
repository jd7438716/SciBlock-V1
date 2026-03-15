import { useState, useRef } from "react";
import { useReferences } from "./useReferences";
import { useWizardForm, type UseWizardFormResult } from "./useWizardForm";
import { useAiAnalysis, type UseAiAnalysisResult } from "./useAiAnalysis";
import { extractOntology } from "@/api/ai";
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
 * On analysis completion the hook calls POST /api/ai/extract-ontology with the
 * text content of any uploaded reference files, then populates the wizard form
 * with the structured response.  If no files were uploaded or extraction fails,
 * the form is left empty for the user to fill manually.
 */
export function useExperimentWizard(): UseExperimentWizardResult {
  const [activeStepId, setActiveStepId] = useState(1);
  const [step1Path, setStep1Path] = useState<Step1Path>("choice");

  const refs = useReferences([]);
  const form = useWizardForm();
  const hasPopulated = useRef(false);

  // Keep a stable ref to refs.readFilesAsText so the aiAnalysis callback
  // always sees the current version without being in the dep array.
  const readFilesAsTextRef = useRef(refs.readFilesAsText);
  readFilesAsTextRef.current = refs.readFilesAsText;

  const populateFromAIRef = useRef(form.populateFromAI);
  populateFromAIRef.current = form.populateFromAI;

  const aiAnalysis = useAiAnalysis({
    onComplete: () => {
      if (hasPopulated.current) return;
      hasPopulated.current = true;

      // Read uploaded file content, then call the real extraction API.
      readFilesAsTextRef.current()
        .then((referenceContent) =>
          extractOntology({
            referenceContent: referenceContent.trim() || undefined,
          }),
        )
        .then((data) => {
          populateFromAIRef.current(data);
        })
        .catch((err) => {
          // Extraction failed (no API key, network error, model error, etc.).
          // Log the error and leave the form empty — user fills manually.
          console.warn("[AI] ontology extraction failed; form left empty:", err);
        });
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
