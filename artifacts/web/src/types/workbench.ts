/**
 * workbench.ts — UI / ontology model types for the experiment workbench.
 *
 * Layer: types (pure data contracts)
 *
 * Scope:
 *   - Ontology model (OntologyModule, OntologyVersion, etc.)
 *   - Workbench UI state enums (WorkbenchFocusMode)
 *   - Module key constants (FLOW_TRIGGER_KEYS, ALL_MODULE_KEYS)
 *
 * ExperimentRecord domain types have moved to types/experiment.ts.
 * Re-exports below maintain backward-compat for all existing imports.
 */

// ---------------------------------------------------------------------------
// Re-exports from types/experiment.ts (backward-compat)
// All existing `import { ExperimentRecord } from "@/types/workbench"` continue
// to work without any import-path changes in consumer files.
// ---------------------------------------------------------------------------

export type {
  ConfirmationState,
  DerivedFromSourceType,
  ExperimentStatus,
  ExperimentRecord,
  PurposeAssistResult,
} from "./experiment";

export { EXPERIMENT_STATUS_OPTIONS } from "./experiment";

// ---------------------------------------------------------------------------
// Ontology
// ---------------------------------------------------------------------------

export type OntologyModuleKey =
  | "system"
  | "preparation"
  | "operation"
  | "measurement"
  | "data";

export type OntologyModuleStatus = "inherited" | "confirmed";

export interface OntologyModule {
  key: OntologyModuleKey;
  title: string;
  /**
   * Structured domain entities for this module.
   * Undefined on legacy records that predate structured data.
   */
  structuredData?: import("./ontologyModules").OntologyModuleStructuredData;
  status: OntologyModuleStatus;
  isHighlighted: boolean;
  updatedAt: string;
}

export type OntologyVersionSource =
  | "initial_generated"
  | "initial_confirmed"
  | "experiment_confirmed";

export interface OntologyVersion {
  id: string;
  versionNumber: number;
  parentVersionId: string | null;
  source: OntologyVersionSource;
  modules: OntologyModule[];
  confirmedAt?: string;
}

// ---------------------------------------------------------------------------
// UI / Layout
// ---------------------------------------------------------------------------

export type WorkbenchFocusMode = "balanced" | "editor" | "ontology";

/** The 4 modules that trigger flow-draft generation when all confirmed. */
export const FLOW_TRIGGER_KEYS: OntologyModuleKey[] = [
  "system",
  "preparation",
  "operation",
  "measurement",
];

/** All 5 modules — must all be confirmed to trigger AI report generation. */
export const ALL_MODULE_KEYS: OntologyModuleKey[] = [
  "system",
  "preparation",
  "operation",
  "measurement",
  "data",
];
