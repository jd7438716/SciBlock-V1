export type FieldType = "text" | "list";

export interface ExperimentField {
  /** Stable React key — generated client-side */
  id: string;
  /** Field category name, e.g. "实验名称", "研究对象" */
  name: string;
  type: FieldType;
  /** Non-empty when type === "text" */
  value: string;
  /** Non-empty when type === "list" */
  items: string[];
}

/** Stable ID generator for new fields / list items */
export function genFieldId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Derive the experiment name from a field list.
 * Looks for a field named "实验名称"; falls back to "".
 */
export function getExperimentName(fields: ExperimentField[]): string {
  return fields.find((f) => f.name === "实验名称")?.value?.trim() ?? "";
}
