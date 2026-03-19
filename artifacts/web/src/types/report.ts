/**
 * Report domain types.
 *
 * Layer: Type definitions — no runtime logic.
 *
 * Two distinct layers:
 *   1. Infrastructure types  — ReportStatus, ReportGeneratorInput, ExperimentReport
 *      (consumed by WorkbenchContext, hooks, ReportSection)
 *   2. Report View Model     — ExperimentReportModel and its sub-types
 *      (produced by reportMapper, consumed by reportRenderer)
 *
 * Kept separate from workbench.ts so report-related types can grow
 * independently (versioned reports, export formats, AI fields, etc.).
 */

// ---------------------------------------------------------------------------
// 1. Infrastructure types (unchanged — consumed by existing code)
// ---------------------------------------------------------------------------

/**
 * Lifecycle state of the AI-generated report for a single ExperimentRecord.
 *
 *   idle       — no report yet; modules not fully confirmed or generation not started
 *   generating — generation in-flight
 *   ready      — reportHtml available (may be user-edited)
 *   error      — generation failed; user can retry
 */
export type ReportStatus = "idle" | "generating" | "ready" | "error";

/** TipTap-compatible HTML string + metadata. Stored as ExperimentRecord.reportHtml. */
export interface ExperimentReport {
  html: string;
  generatedAt: string;
}

/** Input contract for the report generation pipeline. */
export interface ReportGeneratorInput {
  title: string;
  experimentType?: string;
  objective?: string;
  modules: import("@/types/workbench").OntologyModule[];
}

// ---------------------------------------------------------------------------
// 2. Report View Model — report-oriented data structure
//
// This is NOT a mirror of the ontology module structure.
// It represents the *report* abstraction: what a reader of the experiment
// report needs to see, not the raw records a lab operator filled in.
//
// Produced by: utils/reportMapper.ts (mapModulesToReportModel)
// Consumed by: utils/reportRenderer.ts (renderReportModel → HTML)
// ---------------------------------------------------------------------------

/** One core system object, summarised for report display. */
export interface ReportSystemObject {
  name: string;
  role: string;
  /** Single most relevant attribute (e.g. "尺寸：4英寸"), if present. */
  keyAttribute?: string;
}

/** Report-layer summary of the 实验系统 module. */
export interface ReportSystemSummary {
  totalObjects: number;
  /** Up to MAX_SYSTEM_OBJECTS most significant objects. */
  coreObjects: ReportSystemObject[];
  /** True when the full list exceeds the display cap. */
  hasMore: boolean;
}

/** One preparation category with its key items (capped). */
export interface ReportPrepCategory {
  category: string;
  /** Item names only — no raw attribute dump. */
  items: string[];
}

/** Report-layer summary of the 实验准备 module. */
export interface ReportPreparationSummary {
  totalItems: number;
  byCategory: ReportPrepCategory[];
}

/** One key procedure step, simplified for report display. */
export interface ReportProcedureStep {
  order: number;
  name: string;
  /** Single most relevant parameter (e.g. "温度：80 ℃"), if present. */
  keyParam?: string;
}

/** Report-layer summary of the 实验操作 module. */
export interface ReportProcedureSummary {
  totalSteps: number;
  /** Up to MAX_STEPS key steps. */
  keySteps: ReportProcedureStep[];
  /** True when the full list exceeds the display cap. */
  hasMore: boolean;
}

/** One measurement method, summarised for report display. */
export interface ReportMeasurementMethod {
  name: string;
  target: string;
  instrument?: string;
}

/** One data type obtained in the experiment. */
export interface ReportDataType {
  name: string;
  /** Unit extracted from attributes (e.g. "mg/L"), if present. */
  unit?: string;
}

/**
 * Report-layer summary of the 测量过程 + 实验数据 modules (merged).
 *
 * Rationale: measurement and data are two sides of the same coin in a report
 * ("we measured X using method Y and obtained data type Z"). Keeping them
 * separate in the report adds no reader value.
 */
export interface ReportMeasurementDataSummary {
  methods: ReportMeasurementMethod[];
  dataTypes: ReportDataType[];
}

/**
 * Top-level Report View Model.
 *
 * This is the canonical intermediate representation between raw module data
 * and the final rendered HTML. Any future change to the report structure
 * (new sections, AI-generated text, etc.) should be modelled here first,
 * then reflected in the renderer — NOT by directly touching the HTML builder.
 */
export interface ExperimentReportModel {
  title: string;
  experimentType?: string;
  objective?: string;

  /**
   * Template-generated 2–4 sentence executive summary of the experiment.
   * In Phase 1 this is rule-based; Phase 2 will replace it with AI output.
   */
  reportSummary: string;

  systemSummary: ReportSystemSummary;
  preparationSummary: ReportPreparationSummary;
  procedureSummary: ReportProcedureSummary;
  measurementDataSummary: ReportMeasurementDataSummary;

  /**
   * Structured placeholder for the Results & Analysis section.
   * Displayed as a clearly-labelled "next phase" block, not a blank prompt.
   * Phase 2: replaced by AI-generated analysis based on measurement + data.
   */
  findingsPlaceholder: string;

  /**
   * Structured placeholder for the Conclusion section.
   * Phase 2: replaced by AI-generated conclusion tied back to objective.
   */
  conclusionPlaceholder: string;

  /** ISO timestamp when this model was constructed. */
  generatedAt: string;

  /** Generation source — "stub" until AI backend is connected. */
  source: "stub" | "ai" | "manual";
}
