/**
 * reportRenderer.ts — converts a Report View Model into TipTap-compatible HTML.
 *
 * Layer: Presentation / serialization (no React, no context, no business logic).
 *
 * This is the only place that produces report HTML strings.
 * If the visual structure of the report needs to change, only this file
 * changes — the mapper and the model remain stable.
 *
 * Design notes:
 *  - Sections are report-oriented, not module-mirrored.
 *  - Information density is controlled: no full item dumps.
 *  - Placeholder sections are clearly labelled for future AI replacement.
 *  - The output is valid TipTap/ProseMirror-compatible HTML.
 */

import type { ExperimentReportModel } from "@/types/report";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Render an ExperimentReportModel to a TipTap-compatible HTML string. */
export function renderReportModel(model: ExperimentReportModel): string {
  const ts = new Date(model.generatedAt).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const blocks: string[] = [
    renderHeader(model, ts),
    renderObjective(model),
    renderSummary(model),
    renderSystem(model),
    renderPreparation(model),
    renderProcedure(model),
    renderMeasurementData(model),
    renderFindings(model),
    renderConclusion(model),
  ];

  return blocks.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderHeader(model: ExperimentReportModel, ts: string): string {
  const lines: string[] = [];
  lines.push(`<h1>${esc(model.title) || "（未命名实验）"}</h1>`);

  const meta: string[] = [];
  if (model.experimentType) meta.push(`<strong>类型：</strong>${esc(model.experimentType)}`);
  meta.push(`<strong>生成时间：</strong>${ts}`);
  lines.push(`<p>${meta.join("　　")}</p>`);
  lines.push("<hr>");

  return lines.join("\n");
}

function renderObjective(model: ExperimentReportModel): string {
  if (!model.objective) return "";
  return [
    "<h2>一、实验目的</h2>",
    `<p>${esc(model.objective)}</p>`,
  ].join("\n");
}

function renderSummary(model: ExperimentReportModel): string {
  if (!model.reportSummary) return "";
  const sectionNum = model.objective ? "二" : "一";
  return [
    `<h2>${sectionNum}、实验概述</h2>`,
    `<p>${esc(model.reportSummary)}</p>`,
  ].join("\n");
}

function renderSystem(model: ExperimentReportModel): string {
  const { systemSummary } = model;
  const num = sectionNumber(model, "system");

  if (systemSummary.totalObjects === 0) {
    return [
      `<h2>${num}、实验系统与研究对象</h2>`,
      "<p>（暂未填写实验系统信息）</p>",
    ].join("\n");
  }

  const lines: string[] = [`<h2>${num}、实验系统与研究对象</h2>`];

  lines.push("<ul>");
  for (const obj of systemSummary.coreObjects) {
    const rolePart = obj.role ? `【${esc(obj.role)}】` : "";
    const attrPart = obj.keyAttribute ? `　${esc(obj.keyAttribute)}` : "";
    lines.push(`<li><strong>${esc(obj.name)}</strong>${rolePart}${attrPart}</li>`);
  }
  if (systemSummary.hasMore) {
    lines.push(
      `<li><em>… 另有 ${systemSummary.totalObjects - systemSummary.coreObjects.length} 个对象，详见左侧模块记录</em></li>`,
    );
  }
  lines.push("</ul>");

  return lines.join("\n");
}

function renderPreparation(model: ExperimentReportModel): string {
  const { preparationSummary } = model;
  const num = sectionNumber(model, "preparation");

  if (preparationSummary.totalItems === 0) {
    return [
      `<h2>${num}、实验准备</h2>`,
      "<p>（暂未填写实验准备信息）</p>",
    ].join("\n");
  }

  const lines: string[] = [`<h2>${num}、实验准备</h2>`];

  for (const group of preparationSummary.byCategory) {
    lines.push(`<p><strong>${esc(group.category)}</strong></p>`);
    lines.push("<ul>");
    for (const item of group.items) {
      lines.push(`<li>${esc(item)}</li>`);
    }
    lines.push("</ul>");
  }

  if (preparationSummary.totalItems > preparationSummary.byCategory.reduce((s, g) => s + g.items.length, 0)) {
    lines.push(
      `<p><em>（共 ${preparationSummary.totalItems} 项准备事项，上述为各类别关键项）</em></p>`,
    );
  }

  return lines.join("\n");
}

function renderProcedure(model: ExperimentReportModel): string {
  const { procedureSummary } = model;
  const num = sectionNumber(model, "procedure");

  if (procedureSummary.totalSteps === 0) {
    return [
      `<h2>${num}、实验过程</h2>`,
      "<p>（暂未填写实验操作步骤）</p>",
    ].join("\n");
  }

  const lines: string[] = [`<h2>${num}、实验过程</h2>`];
  lines.push(`<p>本实验共执行 ${procedureSummary.totalSteps} 个操作步骤，关键步骤如下：</p>`);
  lines.push("<ol>");

  for (const step of procedureSummary.keySteps) {
    const paramPart = step.keyParam ? `　<em>（${esc(step.keyParam)}）</em>` : "";
    lines.push(`<li>${esc(step.name)}${paramPart}</li>`);
  }

  if (procedureSummary.hasMore) {
    lines.push(
      `<li><em>… 另有 ${procedureSummary.totalSteps - procedureSummary.keySteps.length} 步，详见左侧操作模块记录</em></li>`,
    );
  }

  lines.push("</ol>");
  return lines.join("\n");
}

function renderMeasurementData(model: ExperimentReportModel): string {
  const { measurementDataSummary } = model;
  const num = sectionNumber(model, "measurement");
  const hasMethods   = measurementDataSummary.methods.length > 0;
  const hasDataTypes = measurementDataSummary.dataTypes.length > 0;

  const lines: string[] = [`<h2>${num}、测量与数据获取</h2>`];

  if (!hasMethods && !hasDataTypes) {
    lines.push("<p>（暂未填写测量与数据信息）</p>");
    return lines.join("\n");
  }

  if (hasMethods) {
    lines.push("<p><strong>表征/测量方法</strong></p><ul>");
    for (const m of measurementDataSummary.methods) {
      const instPart = m.instrument ? `，仪器：${esc(m.instrument)}` : "";
      lines.push(`<li>${esc(m.name)}（对象：${esc(m.target)}${instPart}）</li>`);
    }
    lines.push("</ul>");
  }

  if (hasDataTypes) {
    lines.push("<p><strong>获取数据类型</strong></p><ul>");
    for (const d of measurementDataSummary.dataTypes) {
      const unitPart = d.unit ? `（单位：${esc(d.unit)}）` : "";
      lines.push(`<li>${esc(d.name)}${unitPart}</li>`);
    }
    lines.push("</ul>");
  }

  return lines.join("\n");
}

function renderFindings(model: ExperimentReportModel): string {
  const num = sectionNumber(model, "findings");
  return [
    `<h2>${num}、结果分析</h2>`,
    `<p class="report-placeholder">${esc(model.findingsPlaceholder)}</p>`,
    "<p>（可在编辑报告模式下直接补充分析内容）</p>",
  ].join("\n");
}

function renderConclusion(model: ExperimentReportModel): string {
  const num = sectionNumber(model, "conclusion");
  return [
    `<h2>${num}、实验结论</h2>`,
    `<p class="report-placeholder">${esc(model.conclusionPlaceholder)}</p>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Section numbering helper
// ---------------------------------------------------------------------------

const SECTION_ORDER = [
  "objective",
  "summary",
  "system",
  "preparation",
  "procedure",
  "measurement",
  "findings",
  "conclusion",
] as const;
type SectionKey = (typeof SECTION_ORDER)[number];

const CHINESE_NUMS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

function sectionNumber(model: ExperimentReportModel, key: SectionKey): string {
  const sections: SectionKey[] = [];
  if (model.objective) sections.push("objective");
  sections.push("summary", "system", "preparation", "procedure", "measurement", "findings", "conclusion");
  const idx = sections.indexOf(key);
  return CHINESE_NUMS[idx] ?? String(idx + 1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
