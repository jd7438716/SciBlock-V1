/**
 * useSciNoteExperiments — fetches all non-deleted experiment records for one SciNote.
 *
 * Layer: Business logic hook (no UI, wraps api/experiments.ts).
 *
 * Used by SciNoteExperimentsPage to populate the per-project experiment list.
 * Returns ExperimentRecord[] (domain type) so callers never touch wire shapes.
 */

import { useState, useEffect } from "react";
import { listExperiments, apiResponseToRecord } from "@/api/experiments";
import type { ExperimentRecord } from "@/types/workbench";

export interface UseSciNoteExperimentsResult {
  experiments: ExperimentRecord[];
  loading: boolean;
  error: string | null;
}

/**
 * @param sciNoteId  The SciNote (project) whose experiments should be loaded.
 *                  Pass an empty string to skip the fetch (e.g. before params resolve).
 */
export function useSciNoteExperiments(sciNoteId: string): UseSciNoteExperimentsResult {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!sciNoteId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listExperiments(sciNoteId)
      .then((res) => {
        if (cancelled) return;
        setExperiments((res.items ?? []).map(apiResponseToRecord));
      })
      .catch(() => {
        if (cancelled) return;
        setError("加载实验记录失败，请重试");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sciNoteId]);

  return { experiments, loading, error };
}
