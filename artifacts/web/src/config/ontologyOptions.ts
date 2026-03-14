/**
 * ontologyOptions.ts — centralized recommended-option definitions for
 * ontology fields that accept free-text values.
 *
 * These are "soft" recommendations surfaced in the UI as pill buttons.
 * Users can always enter a custom value that overrides or supplements the list.
 *
 * Architecture note — to connect a real ontology / backend schema:
 *   1. Replace the `options` array in the relevant export with values derived
 *      from your schema (fetched at runtime or generated at build time).
 *   2. The editors consume this shape via `OntologyOptionGroup` — they do NOT
 *      know or care where the strings come from.
 *   3. The `colors` map is purely cosmetic; unmapped values fall back to a
 *      neutral style automatically.
 */

export interface OntologyOptionGroup {
  options: string[];
  colors: Record<string, string>;
  defaultValue: string;
}

/**
 * PrepItem.category — generic preparation-item type labels.
 *
 * Scope: domain-independent; matches the four default wizard Step 3 field groups
 * so that wizard → workbench passthrough produces correctly colored badges.
 * Future: replace `options` with values from your experiment ontology schema.
 */
export const PREP_CATEGORY: OntologyOptionGroup = {
  options: ["准备材料", "准备设备", "环境条件", "前处理事项"],
  colors: {
    准备材料:  "bg-green-50 text-green-700 border-green-200",
    准备设备:  "bg-blue-50 text-blue-700 border-blue-200",
    环境条件:  "bg-amber-50 text-amber-700 border-amber-200",
    前处理事项: "bg-violet-50 text-violet-700 border-violet-200",
  },
  defaultValue: "准备材料",
};

/**
 * SystemObject.role — recommended role labels for 实验系统 objects.
 *
 * Scope: material / device classification in a deposition experiment.
 * Future: replace `options` with values from your experiment ontology schema.
 */
export const SYSTEM_ROLE: OntologyOptionGroup = {
  options: ["研究基底", "靶材", "设备", "试剂"],
  colors: {
    研究基底: "bg-blue-50 text-blue-700 border-blue-200",
    靶材:     "bg-violet-50 text-violet-700 border-violet-200",
    设备:     "bg-gray-100 text-gray-600 border-gray-200",
    试剂:     "bg-green-50 text-green-700 border-green-200",
  },
  defaultValue: "研究基底",
};
