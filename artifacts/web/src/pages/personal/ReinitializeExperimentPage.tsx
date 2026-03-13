import React, { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen } from "lucide-react";
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
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { AI_MOCK_FILL } from "@/data/aiMockFill";
import { AppLayout } from "@/components/layout/AppLayout";

const TOTAL_STEPS = 6;
type Step1Path = "choice" | "uploading";

/**
 * ReinitializeExperimentPage — identical wizard flow to NewExperimentPage
 * but targeting an *existing* SciNote:
 *
 * - Note title is preserved (not overwritten from step-2 fields)
 * - On finish → calls reinitializeSciNote(id, formData) → navigates to
 *   the note's detail page
 * - No draft sidebar entry (the note already exists in the sidebar list)
 */
export function ReinitializeExperimentPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { notes, reinitializeSciNote } = useSciNoteStore();

  const note = notes.find((n) => n.id === id);

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

  // Guard: show an error state if the note doesn't exist.
  if (!note) {
    return (
      <AppLayout title="重新初始化">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen size={36} className="text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-500">
            找不到该 SciNote，无法重新初始化
          </p>
        </div>
      </AppLayout>
    );
  }

  function goToStep(stepId: number) {
    if (stepId < 1 || stepId > TOTAL_STEPS) return;
    if (stepId === 1) setStep1Path("choice");
    aiAnalysis.markReviewed(stepId);
    setActiveStepId(stepId);
  }

  function handleAnalyze() {
    refs.analyze();
    aiAnalysis.start();
  }

  /**
   * Write the freshly-filled wizard data back to the existing SciNote
   * (preserving id, title, kind, createdAt), then navigate to its detail page.
   */
  function handleFinish() {
    reinitializeSciNote(id, form.data);
    navigate(`/personal/experiment/${id}`);
  }

  function renderStepContent() {
    switch (activeStepId) {
      case 1:
        return step1Path === "choice" ? (
          <Step1Choice
            onChooseUpload={() => setStep1Path("uploading")}
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

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Wizard step navigation */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col px-4 py-6">
        <div className="mb-4 px-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            重新初始化
          </p>
          <p
            className="text-xs text-gray-500 mt-1 truncate leading-tight"
            title={note.title}
          >
            {note.title}
          </p>
        </div>

        <StepNav
          activeStepId={activeStepId}
          onStepClick={goToStep}
          canFinish={form.canFinish}
          onFinish={handleFinish}
          aiStatuses={aiAnalysis.statuses}
          finishLabel="完成重新初始化"
        />
      </aside>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex flex-col min-h-full px-10 py-10">
          <div className="flex-1">{renderStepContent()}</div>

          {activeStepId >= 2 && (
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
