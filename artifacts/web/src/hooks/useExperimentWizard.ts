import { useState, useRef } from "react";
import { useReferences } from "./useReferences";
import { useWizardForm, type UseWizardFormResult } from "./useWizardForm";
import { useAiAnalysis, type UseAiAnalysisResult } from "./useAiAnalysis";
import { extractOntology } from "@/api/ai";
import { ApiError } from "@/api/client";
import type { UseReferencesResult } from "./useReferences";

export type Step1Path = "choice" | "uploading";

export const WIZARD_TOTAL_STEPS = 6;

export interface UseExperimentWizardResult {
  activeStepId: number;
  step1Path: Step1Path;
  form: UseWizardFormResult;
  refs: UseReferencesResult;
  aiAnalysis: UseAiAnalysisResult;
  /** True while the LLM extraction API call is in-flight */
  isExtracting: boolean;
  /** Non-null when extraction failed; contains a user-visible message */
  extractionError: string | null;
  goToStep: (stepId: number) => void;
  handleChooseUpload: () => void;
  handleAnalyze: () => void;
}

/**
 * Encapsulates all state and handlers shared by the "new experiment" and
 * "reinitialize experiment" wizard flows.
 *
 * When the user clicks "开始分析":
 *  1. The progress animation starts immediately (useAiAnalysis fake timers).
 *  2. The real LLM extraction call also starts immediately, in parallel.
 *  3. When extraction succeeds, form.populateFromAI() fills all steps at once.
 *  4. isExtracting / extractionError reflect the live API call state so the
 *     wizard steps 2-6 can show loading or error banners while waiting.
 */
export function useExperimentWizard(): UseExperimentWizardResult {
  const [activeStepId, setActiveStepId] = useState(1);
  const [step1Path, setStep1Path] = useState<Step1Path>("choice");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const refs = useReferences([]);
  const form = useWizardForm();

  /** Guards against double-firing when the user clicks analyze more than once */
  const extractionStartedRef = useRef(false);

  // Stable refs so closures always see the latest version of these callbacks.
  const readFilesAsTextRef = useRef(refs.readFilesAsText);
  readFilesAsTextRef.current = refs.readFilesAsText;

  const populateFromAIRef = useRef(form.populateFromAI);
  populateFromAIRef.current = form.populateFromAI;

  // useAiAnalysis drives the step-by-step progress animation in the nav.
  // Extraction has already been fired from handleAnalyze(), so onComplete
  // is intentionally left as a no-op.
  const aiAnalysis = useAiAnalysis({ onComplete: () => {} });

  function goToStep(stepId: number) {
    if (stepId < 1 || stepId > WIZARD_TOTAL_STEPS) return;
    if (stepId === 1) setStep1Path("choice");
    aiAnalysis.markReviewed(stepId);
    setActiveStepId(stepId);
  }

  function handleChooseUpload() {
    setStep1Path("uploading");
  }

  /**
   * Called when the user clicks "开始分析" in Step 1.
   *
   * Starts both the visual progress animation (aiAnalysis.start) AND the real
   * LLM extraction call (extractOntology) at the same time so that:
   *   – The user sees immediate visual feedback via the progress animation.
   *   – The API call runs in the background during the ~4 s animation.
   *   – Steps 2-6 show a loading banner until extraction resolves.
   */
  function handleAnalyze() {
    if (extractionStartedRef.current) return;
    extractionStartedRef.current = true;

    // 1. Start the visual progress animation.
    refs.analyze();
    aiAnalysis.start();

    // 2. Start the real extraction call in parallel.
    setIsExtracting(true);
    setExtractionError(null);

    readFilesAsTextRef
      .current()
      .then((referenceContent) =>
        extractOntology({
          referenceContent: referenceContent.trim() || undefined,
        }),
      )
      .then((data) => {
        populateFromAIRef.current(data);
        setIsExtracting(false);
      })
      .catch((err: unknown) => {
        // Derive a user-friendly message from the error.
        let msg = "提取失败，请稍后重试";
        if (err instanceof ApiError) {
          if (err.status === 503 || err.code === "ai_not_configured") {
            msg = "AI 服务未配置，请联系管理员";
          } else if (err.status === 0 || err.message.toLowerCase().includes("timeout")) {
            msg = "请求超时，请检查网络后重试";
          }
        }
        setExtractionError(msg);
        setIsExtracting(false);
      });
  }

  return {
    activeStepId,
    step1Path,
    form,
    refs,
    aiAnalysis,
    isExtracting,
    extractionError,
    goToStep,
    handleChooseUpload,
    handleAnalyze,
  };
}
