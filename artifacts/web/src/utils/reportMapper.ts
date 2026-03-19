/**
 * reportMapper.ts — converts raw module data into a Report View Model.
 *
 * Layer: Data transformation (no UI, no React, no context).
 *
 * This is the single authoritative translation layer between the ontology
 * module domain (system / preparation / operation / measurement / data) and
 * the report domain (ExperimentReportModel).
 *
 * Rules:
 *  - All "from modules → report" logic lives here and only here.
 *  - The mapper caps list lengths (no raw dumps).
 *  - If ontology module field names change, only this file needs updating.
 *  - The mapper never produces HTML — that is the renderer's job.
 */

import type { ReportGeneratorInput, ExperimentReportModel } from "@/types/report";
import type {
  SystemObject,
  PrepItem,
  OperationStep,
  MeasurementItem,
  DataItem,
} from "@/types/ontologyModules";

// ---------------------------------------------------------------------------
// Display caps — keep report density controlled
// ---------------------------------------------------------------------------

const MAX_SYSTEM_OBJECTS  = 5;
const MAX_PREP_PER_CAT    = 5;
const MAX_PROCEDURE_STEPS = 8;
const MAX_MEASUREMENTS    = 5;
const MAX_DATA_TYPES      = 5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maps raw ontology module data into an ExperimentReportModel.
 *
 * Input:  ReportGeneratorInput (title, experimentType, objective, modules[])
 * Output: ExperimentReportModel (structured, report-oriented, display-capped)
 */
export function mapModulesToReportModel(
  input: ReportGeneratorInput,
): ExperimentReportModel {
  const { title, experimentType, objective, modules } = input;

  const sd = (key: string) =>
    modules.find((m) => m.key === key)?.structuredData ?? {};

  const systemObjects    = (sd("system").systemObjects        ?? []) as SystemObject[];
  const prepItems        = (sd("preparation").prepItems        ?? []) as PrepItem[];
  const operationSteps   = (sd("operation").operationSteps     ?? []) as OperationStep[];
  const measurementItems = (sd("measurement").measurementItems ?? []) as MeasurementItem[];
  const dataItems        = (sd("data").dataItems               ?? []) as DataItem[];

  return {
    title,
    experimentType,
    objective,
    reportSummary:          buildReportSummary(title, experimentType, objective, systemObjects, operationSteps, measurementItems),
    systemSummary:          buildSystemSummary(systemObjects),
    preparationSummary:     buildPreparationSummary(prepItems),
    procedureSummary:       buildProcedureSummary(operationSteps),
    measurementDataSummary: buildMeasurementDataSummary(measurementItems, dataItems),
    findingsPlaceholder:
      "本区块将在下一阶段基于实验数据、测量结果和对照信息自动生成分析内容，当前可由用户手动补充。",
    conclusionPlaceholder:
      "本区块为结论占位，将在下一阶段基于结果分析和实验目标自动生成初步结论，当前可由用户手动补充。",
    generatedAt: new Date().toISOString(),
    source: "stub",
  };
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

/**
 * 实验概述 — template-based 2–4 sentence summary.
 * Phase 2: this will be replaced by an AI-generated paragraph.
 */
function buildReportSummary(
  title: string,
  experimentType: string | undefined,
  objective: string | undefined,
  systemObjects: SystemObject[],
  operationSteps: OperationStep[],
  measurementItems: MeasurementItem[],
): string {
  const parts: string[] = [];

  const titlePart = title ? `《${title}》` : "本实验";
  const typePart  = experimentType ? `属于${experimentType}类研究` : "";
  parts.push(`${titlePart}${typePart ? typePart + "，" : ""}旨在通过实验手段获取系统性数据。`);

  if (objective) {
    parts.push(`实验目标为：${objective}。`);
  }

  const descParts: string[] = [];
  if (systemObjects.length > 0) {
    const roles = [...new Set(systemObjects.map((o) => o.role).filter(Boolean))];
    descParts.push(
      roles.length > 0
        ? `实验系统涉及 ${roles.join("、")} 等 ${systemObjects.length} 个核心对象`
        : `实验系统包含 ${systemObjects.length} 个研究对象`,
    );
  }
  if (operationSteps.length > 0) {
    descParts.push(`共执行 ${operationSteps.length} 个操作步骤`);
  }
  if (measurementItems.length > 0) {
    descParts.push(`采用 ${measurementItems.length} 种测量/表征方法`);
  }
  if (descParts.length > 0) {
    parts.push(descParts.join("，") + "。");
  }

  return parts.join(" ").trim();
}

/** 实验系统与对象 — capped, role-aware summary. */
function buildSystemSummary(
  systemObjects: SystemObject[],
): ExperimentReportModel["systemSummary"] {
  const coreObjects = systemObjects.slice(0, MAX_SYSTEM_OBJECTS).map((obj) => ({
    name: obj.name,
    role: obj.role,
    keyAttribute:
      obj.attributes.length > 0
        ? `${obj.attributes[0].key}：${obj.attributes[0].value}`
        : undefined,
  }));

  return {
    totalObjects: systemObjects.length,
    coreObjects,
    hasMore: systemObjects.length > MAX_SYSTEM_OBJECTS,
  };
}

/** 实验准备 — grouped by category, capped per category. */
function buildPreparationSummary(
  prepItems: PrepItem[],
): ExperimentReportModel["preparationSummary"] {
  const catMap = new Map<string, string[]>();

  for (const item of prepItems) {
    const cat = item.category?.trim() || "其他";
    if (!catMap.has(cat)) catMap.set(cat, []);
    const bucket = catMap.get(cat)!;
    if (bucket.length < MAX_PREP_PER_CAT) bucket.push(item.name);
  }

  return {
    totalItems: prepItems.length,
    byCategory: Array.from(catMap.entries()).map(([category, items]) => ({
      category,
      items,
    })),
  };
}

/** 实验过程 — top N steps, key param only. */
function buildProcedureSummary(
  operationSteps: OperationStep[],
): ExperimentReportModel["procedureSummary"] {
  const sorted   = [...operationSteps].sort((a, b) => a.order - b.order);
  const keySteps = sorted.slice(0, MAX_PROCEDURE_STEPS).map((step) => ({
    order:    step.order,
    name:     step.name,
    keyParam:
      step.params.length > 0
        ? `${step.params[0].key}：${step.params[0].value}`
        : undefined,
  }));

  return {
    totalSteps: operationSteps.length,
    keySteps,
    hasMore: operationSteps.length > MAX_PROCEDURE_STEPS,
  };
}

/**
 * 测量与数据获取 — merged section.
 * Measurement and data are combined into one report section because they
 * represent two perspectives on the same activity (how vs. what was captured).
 */
function buildMeasurementDataSummary(
  measurementItems: MeasurementItem[],
  dataItems: DataItem[],
): ExperimentReportModel["measurementDataSummary"] {
  const methods = measurementItems.slice(0, MAX_MEASUREMENTS).map((item) => ({
    name:       item.name,
    target:     item.target,
    instrument: item.instrument,
  }));

  const dataTypes = dataItems.slice(0, MAX_DATA_TYPES).map((item) => ({
    name: item.name,
    unit: item.attributes.find((a) => a.key === "单位")?.value,
  }));

  return { methods, dataTypes };
}
