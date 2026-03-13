import { useState, useRef, useEffect } from "react";
import type { StepAiStatus, StepAiStatusMap } from "@/types/experiment";

/**
 * Wizard steps that participate in AI analysis, in processing order.
 * Step 6 (实验数据) is intentionally excluded — data is collected live.
 */
const AI_STEPS = [1, 2, 3, 4, 5] as const;

/**
 * Simulated processing time per step (ms).
 * Step 1 (reference analysis) is the longest; subsequent steps are faster.
 */
const STEP_DURATION: Record<number, number> = {
  1: 1500, // 分析参考内容
  2: 900,  // 补全实验系统
  3: 750,  // 补全实验准备
  4: 700,  // 补全实验操作
  5: 650,  // 补全测量过程
};

interface Options {
  /** Called once after ALL steps have finished generating. */
  onComplete: () => void;
}

export interface UseAiAnalysisResult {
  /** Per-step AI status. Only populated steps appear in the map; absent means "idle". */
  statuses: StepAiStatusMap;
  /** True while the sequential generation is running */
  isRunning: boolean;
  /** True after all AI_STEPS have reached "generated" */
  isComplete: boolean;
  /** Begin the sequential analysis. No-op if already running or complete. */
  start: () => void;
  /**
   * Transition a step from "generated" → "reviewed".
   * Should be called when the user navigates to a generated step.
   */
  markReviewed: (stepId: number) => void;
}

export function useAiAnalysis({ onComplete }: Options): UseAiAnalysisResult {
  const [statuses, setStatuses] = useState<Map<number, StepAiStatus>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Stable refs so the async sequence doesn't close over stale values.
  const isRunningRef = useRef(false);
  const isCompleteRef = useRef(false);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function setStepStatus(stepId: number, status: StepAiStatus) {
    if (!mountedRef.current) return;
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(stepId, status);
      return next;
    });
  }

  function start() {
    if (isRunningRef.current || isCompleteRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);

    async function runSequence() {
      for (const stepId of AI_STEPS) {
        if (!mountedRef.current) return;
        setStepStatus(stepId, "processing");
        await new Promise<void>((resolve) =>
          setTimeout(resolve, STEP_DURATION[stepId]),
        );
        if (!mountedRef.current) return;
        setStepStatus(stepId, "generated");
      }

      if (!mountedRef.current) return;
      isRunningRef.current = false;
      isCompleteRef.current = true;
      setIsRunning(false);
      setIsComplete(true);
      onCompleteRef.current();
    }

    runSequence();
  }

  function markReviewed(stepId: number) {
    setStatuses((prev) => {
      if (prev.get(stepId) !== "generated") return prev;
      const next = new Map(prev);
      next.set(stepId, "reviewed");
      return next;
    });
  }

  return { statuses, isRunning, isComplete, start, markReviewed };
}
