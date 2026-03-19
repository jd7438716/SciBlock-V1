/**
 * report.ts — data access layer for experiment report generation.
 *
 * Layer: API / data access (no React, no context).
 *
 * Current implementation: stub that simulates a 1.5 s network delay, then
 * runs the full mapper → model → renderer pipeline locally.
 *
 * Pipeline:
 *   ReportGeneratorInput
 *     → mapModulesToReportModel()   [utils/reportMapper.ts]
 *     → ExperimentReportModel
 *     → renderReportModel()         [utils/reportRenderer.ts]
 *     → HTML string
 *
 * Migration path to real AI backend (Phase 2):
 *   Replace the setTimeout block with:
 *     POST /api/experiments/:id/report/generate
 *   Keep the function signature identical — all callers (useExperimentReport,
 *   WorkbenchContext) need zero changes.
 */

import type { ReportGeneratorInput } from "@/types/report";
import { mapModulesToReportModel } from "@/utils/reportMapper";
import { renderReportModel }       from "@/utils/reportRenderer";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an experiment report HTML string from confirmed module data.
 *
 * Phase 1: local stub (no network, no AI).
 * Phase 2: replace body with fetch() to backend AI endpoint.
 */
export async function generateExperimentReport(
  input: ReportGeneratorInput,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const model = mapModulesToReportModel(input);
  return renderReportModel(model);
}
