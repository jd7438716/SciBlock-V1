/**
 * useExperimentReport — encapsulates manual report generation state and actions.
 *
 * Layer: Business logic hook (no UI, no direct context access).
 *
 * Phase 1 of the WorkbenchContext report extraction. This hook owns the logic
 * for the *manual* report generation path:
 *   - reportStatus derivation
 *   - triggerReportGeneration (manual button click)
 *   - updateReport (user-edited report HTML)
 *   - clearReport (reset to idle)
 *
 * The *automatic* trigger path (all 5 modules confirmed → auto-generate) is
 * intentionally left inside setModuleStatus() in WorkbenchContext and will be
 * addressed in Phase 2. To share state ownership, WorkbenchContext holds the
 * isGenerating / hasError state variables and passes them here as params —
 * this keeps setModuleStatus's direct setState calls working without change.
 *
 * Consumer: WorkbenchContext (spreads the returned value into context value).
 */

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ExperimentRecord } from "@/types/workbench";
import type { ReportStatus } from "@/types/report";
import { generateExperimentReport } from "@/api/report";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseExperimentReportParams {
  /** Parent SciNote metadata — forwarded to the report generation API. */
  experimentType:     string | undefined;
  objective:          string | undefined;
  /** Current record snapshot (used as the source for report generation). */
  currentRecord:      ExperimentRecord;
  /** Stable ID of the current record — used to update the correct item in setRecords. */
  currentRecordId:    string;
  /**
   * State ownership stays in WorkbenchContext so that setModuleStatus()'s
   * auto-trigger path can continue to call setIsGenerating / setHasError
   * directly without being refactored in Phase 1.
   */
  isGenerating:       boolean;
  hasError:           boolean;
  setIsGenerating:    Dispatch<SetStateAction<boolean>>;
  setHasError:        Dispatch<SetStateAction<boolean>>;
  /** Full records setter — triggerReportGeneration writes reportHtml via functional update. */
  setRecords:         Dispatch<SetStateAction<ExperimentRecord[]>>;
  /**
   * Convenience patcher for the current record.
   * Defined in WorkbenchContext and closes over the latest currentRecordId.
   */
  patchCurrentRecord: (patch: Partial<ExperimentRecord>) => void;
}

export interface UseExperimentReportResult {
  /** Derived from isGenerating + hasError + currentRecord.reportHtml */
  reportStatus:            ReportStatus;
  /** Manually trigger report generation (e.g. after partial confirm or retry). */
  triggerReportGeneration: () => void;
  /** Persist user-edited report HTML back to the record. */
  updateReport:            (html: string) => void;
  /** Clear the generated report (reset to idle). */
  clearReport:             () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExperimentReport({
  experimentType,
  objective,
  currentRecord,
  currentRecordId,
  isGenerating,
  hasError,
  setIsGenerating,
  setHasError,
  setRecords,
  patchCurrentRecord,
}: UseExperimentReportParams): UseExperimentReportResult {

  // Derive reportStatus — no memo needed, values are primitives / object ref.
  const reportStatus: ReportStatus =
    isGenerating      ? "generating"
    : hasError        ? "error"
    : currentRecord.reportHtml ? "ready"
    : "idle";

  /**
   * Manual trigger: user clicks "重新生成" or the retry button.
   * Uses currentRecord at call time — the useCallback deps ensure the
   * callback re-creates whenever the record changes so content is never stale.
   */
  const triggerReportGeneration = useCallback(() => {
    if (isGenerating) return;
    setIsGenerating(true);
    setHasError(false);

    generateExperimentReport({
      title:          currentRecord.title,
      experimentType,
      objective,
      modules:        currentRecord.currentModules,
    })
      .then((html) => {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === currentRecordId ? { ...r, reportHtml: html } : r,
          ),
        );
        setIsGenerating(false);
      })
      .catch(() => {
        setIsGenerating(false);
        setHasError(true);
      });
  }, [
    isGenerating,
    currentRecord,
    experimentType,
    objective,
    currentRecordId,
    setIsGenerating,
    setHasError,
    setRecords,
  ]);

  const updateReport = useCallback(
    (html: string) => patchCurrentRecord({ reportHtml: html }),
    [patchCurrentRecord],
  );

  const clearReport = useCallback(() => {
    patchCurrentRecord({ reportHtml: undefined });
    setHasError(false);
  }, [patchCurrentRecord, setHasError]);

  return { reportStatus, triggerReportGeneration, updateReport, clearReport };
}
