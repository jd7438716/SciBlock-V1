/**
 * Report domain types.
 *
 * Layer: Type definitions — no runtime logic, imported by context, hooks, and components.
 *
 * Kept separate from workbench.ts so that report-related types can grow
 * independently (e.g. adding versioned reports, export formats, etc.).
 */

// ---------------------------------------------------------------------------
// Report status
// ---------------------------------------------------------------------------

/**
 * Lifecycle state of the AI-generated report for a single ExperimentRecord.
 *
 *   idle       — no report yet; not all modules confirmed
 *   generating — API request in-flight
 *   ready      — report HTML available (may be user-edited)
 *   error      — generation failed; user can retry
 */
export type ReportStatus = "idle" | "generating" | "ready" | "error";

// ---------------------------------------------------------------------------
// Report shape (persisted inside ExperimentRecord.reportHtml as a plain HTML
// string; this interface is used by the generator and the UI components)
// ---------------------------------------------------------------------------

export interface ExperimentReport {
  /** TipTap-compatible HTML string. */
  html: string;
  /** ISO timestamp when the report was first generated. */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Input to the report generator
// ---------------------------------------------------------------------------

export interface ReportGeneratorInput {
  title: string;
  experimentType?: string;
  objective?: string;
  modules: import("@/types/workbench").OntologyModule[];
}
