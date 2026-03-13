export interface WizardStep {
  id: number;
  label: string;
}

/**
 * AI analysis / generation status for an individual wizard step.
 *
 * "idle"       — not yet touched by AI (default)
 * "processing" — AI is currently analyzing / generating content for this step
 * "generated"  — content has been auto-generated; user has not yet reviewed it
 * "reviewed"   — user navigated to this step after AI generation
 *
 * State machine (one-way):
 *   idle → processing → generated → reviewed
 */
export type StepAiStatus = "idle" | "processing" | "generated" | "reviewed";

/** Immutable map from stepId → StepAiStatus */
export type StepAiStatusMap = ReadonlyMap<number, StepAiStatus>;

export type FileStatus = "pending" | "analyzing" | "done";

export interface ImportedFile {
  id: string;
  name: string;
  fileType: string;   // e.g. "PDF", "DOCX"
  size: string;       // human-readable
  importedAt: string; // display string, e.g. "14:32"
  status: FileStatus;
}
