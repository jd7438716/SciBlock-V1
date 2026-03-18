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
// Experiment record — confirmation chain fields
// ---------------------------------------------------------------------------

/**
 * Three-state lifecycle of an ExperimentRecord.
 * Managed exclusively by the server; the frontend treats this as read-only.
 *
 *   draft           — created, never confirm-saved.
 *   confirmed       — confirm-saved at least once; heritable modules are locked in.
 *   confirmed_dirty — confirmed previously, but modules edited since last confirm.
 */
export type ConfirmationState = "draft" | "confirmed" | "confirmed_dirty";

/**
 * Whether a record's heritable defaults came from the SciNote's immutable
 * initial_modules ("initial") or from a prior confirmed record ("record").
 */
export type DerivedFromSourceType = "initial" | "record";

// ---------------------------------------------------------------------------
// Experiment record
// ---------------------------------------------------------------------------

export type ExperimentStatus = "探索中" | "可复现" | "失败" | "已验证";

export const EXPERIMENT_STATUS_OPTIONS: ExperimentStatus[] = [
  "探索中",
  "可复现",
  "失败",
  "已验证",
];

export interface ExperimentRecord {
  id: string;
  sciNoteId: string;
  title: string;
  purposeInput?: string;
  experimentStatus: ExperimentStatus;
  experimentCode: string;
  tags: string[];
  /** Which ontology version this record inherited from (legacy / forward-ref field) */
  inheritedOntologyVersionId: string;
  /** Live working copy of modules — may diverge from the inherited version */
  currentModules: OntologyModule[];
  /** TipTap HTML content */
  editorContent: string;
  createdAt: string;
  /** Server-assigned last-modification timestamp. Used e.g. for deletedAt in trash. */
  updatedAt?: string;
  /**
   * AI-generated experiment report HTML.
   * Persisted to sessionStorage alongside the rest of the record.
   * Undefined until all five modules are confirmed and the report is generated.
   */
  reportHtml?: string;

  // ---------------------------------------------------------------------------
  // Inheritance-chain fields (server-assigned; read-only in frontend)
  // ---------------------------------------------------------------------------

  /** 1-based ordinal position of this record within its SciNote. */
  sequenceNumber: number;

  /** Confirmation lifecycle state. Managed by the server. */
  confirmationState: ConfirmationState;

  /** ISO timestamp of the most recent confirm-save action. Undefined until first confirm. */
  confirmedAt?: string;

  /**
   * Where this record's heritable defaults came from.
   * "initial"  → seeded from the SciNote's wizard initialization modules.
   * "record"   → inherited from the last confirmed record in the chain.
   */
  derivedFromSourceType: DerivedFromSourceType;

  /**
   * The sequence_number of the record this record inherited from.
   * Undefined when derivedFromSourceType === "initial".
   * Used for the banner: "已继承第N条确认保存的记录"
   */
  derivedFromRecordSeq?: number;

  /**
   * The ID of the record this record inherited from.
   * Undefined when derivedFromSourceType === "initial".
   */
  derivedFromRecordId?: string;

  /** context_version of the parent SciNote at creation time (audit field). */
  derivedFromContextVer: number;
}

// ---------------------------------------------------------------------------
// AI title assist
// ---------------------------------------------------------------------------

export interface PurposeAssistResult {
  generatedTitle: string;
  purposeDraft: string;
  highlightedModuleKeys: OntologyModuleKey[];
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
