import type { ExperimentField } from "./experimentFields";

/**
 * All wizard steps now share the same "configurable field groups" model.
 * Each step holds an array of ExperimentField entries (type: text | list | object).
 *
 * This keeps the data shape uniform across steps 2–6 and mirrors the
 * future backend schema:  step → category → items[] → tags[].
 */

export interface StepData {
  fields: ExperimentField[];
}

// Named aliases for clarity in the rest of the codebase
export type Step2Data = StepData; // 实验系统
export type Step3Data = StepData; // 实验准备
export type Step4Data = StepData; // 实验操作
export type Step5Data = StepData; // 测量过程
export type Step6Data = StepData; // 实验数据

export interface WizardFormData {
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
}
