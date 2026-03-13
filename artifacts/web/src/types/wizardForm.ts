import type { ExperimentField } from "./experimentFields";

/**
 * Step 2 — 实验系统
 * Configurable field group: the user can add, delete, and edit field categories.
 * AI extraction is also converted into this structure so the user can refine it.
 */
export interface Step2Data {
  fields: ExperimentField[];
}

export interface Step3Data {
  materials: string;
  environment: string;
  estimatedTime: string;
}

export interface Step4Data {
  operationSteps: string;
  cautions: string;
}

export interface Step5Data {
  metrics: string;
  method: string;
  instruments: string;
}

export interface Step6Data {
  recordingMethod: string;
  expectedResults: string;
}

export interface WizardFormData {
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
}
