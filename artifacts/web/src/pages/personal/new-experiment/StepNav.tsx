import React from "react";
import { CheckCircle2 } from "lucide-react";
import { EXPERIMENT_STEPS } from "@/config/experimentSteps";
import type { WizardStep } from "@/types/experiment";

interface Props {
  activeStepId: number;
  onStepClick: (stepId: number) => void;
  canFinish: boolean;
  onFinish: () => void;
}

function StepItem({
  step,
  active,
  done,
  onClick,
}: {
  step: WizardStep;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <span
        className={[
          "flex-shrink-0 w-5 h-5 rounded-full border text-xs flex items-center justify-center font-medium",
          active
            ? "border-white text-white"
            : done
              ? "border-green-500 text-green-500"
              : "border-gray-300 text-gray-400",
        ].join(" ")}
      >
        {done ? <CheckCircle2 size={14} className="text-green-500" /> : step.id}
      </span>
      <span className="text-sm leading-tight">{step.label}</span>
    </button>
  );
}

export function StepNav({ activeStepId, onStepClick, canFinish, onFinish }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Step list */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {EXPERIMENT_STEPS.map((step) => (
          <StepItem
            key={step.id}
            step={step}
            active={activeStepId === step.id}
            done={step.id < activeStepId}
            onClick={() => onStepClick(step.id)}
          />
        ))}
      </nav>

      {/* Bottom finish area */}
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
          开始记录实验
        </button>
      </div>
    </div>
  );
}
