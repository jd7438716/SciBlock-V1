import React from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { EXPERIMENT_STEPS } from "@/config/experimentSteps";
import type { WizardStep } from "@/types/experiment";
import type { StepAiStatus, StepAiStatusMap } from "@/types/experiment";

interface Props {
  activeStepId: number;
  onStepClick: (stepId: number) => void;
  canFinish: boolean;
  onFinish: () => void;
  /** Per-step AI analysis / generation status. Absent key means "idle". */
  aiStatuses?: StepAiStatusMap;
  /** Label for the finish button. Defaults to "开始记录实验". */
  finishLabel?: string;
}

// ---------------------------------------------------------------------------
// Left circle indicator — shows step number or active state
// ---------------------------------------------------------------------------

function LeftIndicator({
  stepId,
  active,
}: {
  stepId: number;
  active: boolean;
}) {
  if (active) {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full border border-white text-white text-xs flex items-center justify-center font-medium">
        {stepId}
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 text-gray-400 text-xs flex items-center justify-center font-medium">
      {stepId}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Right AI-state badge — spinner, sparkle, or check
// ---------------------------------------------------------------------------

function AiBadge({ status }: { status: StepAiStatus | undefined }) {
  switch (status) {
    case "processing":
      return (
        <Loader2
          size={13}
          className="flex-shrink-0 text-sky-500 animate-spin"
          aria-label="正在处理"
        />
      );
    case "generated":
      return (
        <Sparkles
          size={11}
          className="flex-shrink-0 text-sky-400"
          aria-label="已自动生成"
        />
      );
    case "reviewed":
      return (
        <Check
          size={11}
          className="flex-shrink-0 text-blue-400"
          aria-label="已审阅"
        />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// StepItem
// ---------------------------------------------------------------------------

interface StepItemProps {
  step: WizardStep;
  active: boolean;
  aiStatus: StepAiStatus | undefined;
  onClick: () => void;
}

function StepItem({ step, active, aiStatus, onClick }: StepItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <LeftIndicator stepId={step.id} active={active} />
      <span className="flex-1 text-sm leading-tight">{step.label}</span>
      <AiBadge status={aiStatus} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// StepNav
// ---------------------------------------------------------------------------

export function StepNav({
  activeStepId,
  onStepClick,
  canFinish,
  onFinish,
  aiStatuses,
  finishLabel = "开始记录实验",
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {EXPERIMENT_STEPS.map((step) => (
          <StepItem
            key={step.id}
            step={step}
            active={activeStepId === step.id}
            aiStatus={aiStatuses?.get(step.id)}
            onClick={() => onStepClick(step.id)}
          />
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3 px-1">实验初始化完毕后即可开始记录</p>
        <button
          disabled={!canFinish}
          onClick={onFinish}
          className={[
            "w-full py-2 rounded-lg text-sm font-medium transition-colors",
            canFinish
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          {finishLabel}
        </button>
      </div>
    </div>
  );
}
