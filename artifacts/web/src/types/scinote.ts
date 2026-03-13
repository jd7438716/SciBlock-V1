import type { WizardFormData } from "./wizardForm";

export interface SciNote {
  id: string;
  title: string;
  /**
   * "placeholder" — static seed data loaded on startup
   * "wizard"      — created via the experiment initialization wizard
   */
  kind: "placeholder" | "wizard";
  createdAt?: string;
  /** Populated only for wizard-created notes */
  formData?: WizardFormData;
}
