import React from "react";
import { StepNav } from "./StepNav";
import { StepFooter } from "./StepFooter";
import { WizardStepContent } from "./WizardStepContent";
import { WIZARD_TOTAL_STEPS } from "@/hooks/useExperimentWizard";
import type { UseExperimentWizardResult } from "@/hooks/useExperimentWizard";

interface Props {
  wizard: UseExperimentWizardResult;
  /**
   * Slot rendered at the top of the left wizard nav sidebar.
   * Use this for page-specific headings (e.g. "初始化步骤" vs "重新初始化 / <note title>").
   */
  navHeader: React.ReactNode;
  /** Finish-button label. Defaults to StepNav's own default ("开始记录实验"). */
  finishLabel?: string;
  onFinish: () => void;
  /** When true, finish button shows spinner and is disabled (prevents double-submit). */
  submitting?: boolean;
}

/**
 * WizardShell — the shared layout used by both NewExperimentPage and
 * ReinitializeExperimentPage.
 *
 * Layout:
 *   [left aside: navHeader + StepNav] | [right main: step content + footer]
 */
export function WizardShell({ wizard, navHeader, finishLabel, onFinish, submitting }: Props) {
  const { activeStepId, aiAnalysis, form, goToStep } = wizard;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Wizard step navigation */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col px-4 py-6">
        {navHeader}
        <StepNav
          activeStepId={activeStepId}
          onStepClick={goToStep}
          canFinish={form.canFinish}
          onFinish={onFinish}
          aiStatuses={aiAnalysis.statuses}
          finishLabel={finishLabel}
          submitting={submitting}
        />
      </aside>

      {/* Step content area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex flex-col min-h-full px-10 py-10">
          <div className="flex-1">
            <WizardStepContent wizard={wizard} />
          </div>

          {activeStepId >= 2 && (
            <StepFooter
              stepId={activeStepId}
              totalSteps={WIZARD_TOTAL_STEPS}
              onPrev={() => goToStep(activeStepId - 1)}
              onNext={() => goToStep(activeStepId + 1)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
