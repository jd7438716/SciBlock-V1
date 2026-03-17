/**
 * useRecentExperimentFeed — fetches the recent-experiments list for the home
 * page feed.
 *
 * Responsibilities:
 *   - Calls listRecentExperiments(limit) once on mount.
 *   - Manages loading / error / items three-state.
 *
 * Explicitly NOT responsible for:
 *   - Any SciNoteStoreContext interaction (fully independent).
 *   - Any navigation or click handling.
 *   - Any data transformation (all normalization lives in the API adapter).
 */

import { useState, useEffect } from "react";
import { listRecentExperiments } from "@/api/recentExperiments";
import type { RecentExperimentItem } from "@/types/recentExperiment";

interface UseRecentExperimentFeedResult {
  items:   RecentExperimentItem[];
  loading: boolean;
  error:   Error | null;
}

export function useRecentExperimentFeed(limit = 8): UseRecentExperimentFeedResult {
  const [items,   setItems]   = useState<RecentExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    listRecentExperiments(limit)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("加载失败"));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [limit]);

  return { items, loading, error };
}
