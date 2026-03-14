/**
 * Structured data types for each ontology module.
 *
 * These types represent the domain-level entities inside each module,
 * as opposed to the flat `content: string` which is used by the editing textarea.
 *
 * Rule: only module view components and workbenchMockData import from here.
 *       WorkbenchContext and OntologyModuleEditor deal with OntologyModule
 *       (from types/workbench) and call into these types via structuredData.
 */

// ---------------------------------------------------------------------------
// System — research objects / apparatus
// ---------------------------------------------------------------------------

export interface SystemObject {
  id: string;
  /** Display name of the object (e.g. "Si(100) 基底") */
  name: string;
  /** Role label (e.g. "研究基底" | "靶材" | "设备") */
  role: string;
  /** Short attribute chips (e.g. ["4英寸", "1–10 Ω·cm"]) */
  attributes: string[];
  description?: string;
}

// ---------------------------------------------------------------------------
// Preparation — items needed before the experiment
// ---------------------------------------------------------------------------

export interface PrepItem {
  id: string;
  name: string;
  /** Category label (e.g. "基底清洗" | "表面活化" | "靶材处理") */
  category: string;
  duration?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Operation — ordered procedure steps
// ---------------------------------------------------------------------------

export interface OperationStep {
  id: string;
  order: number;
  name: string;
  /** Key parameters in condensed form (e.g. "RF 150 W, 5 min") */
  params?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Measurement — characterization / measurement items
// ---------------------------------------------------------------------------

export interface MeasurementItem {
  id: string;
  name: string;
  instrument?: string;
  method?: string;
  /** What this measurement aims to determine */
  target: string;
  conditions?: string;
}

// ---------------------------------------------------------------------------
// Data — output data items / variables
// ---------------------------------------------------------------------------

export interface DataItem {
  id: string;
  name: string;
  unit?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Aggregate — carried on OntologyModule.structuredData
// ---------------------------------------------------------------------------

export interface OntologyModuleStructuredData {
  systemObjects?: SystemObject[];
  prepItems?: PrepItem[];
  operationSteps?: OperationStep[];
  measurementItems?: MeasurementItem[];
  dataItems?: DataItem[];
}
