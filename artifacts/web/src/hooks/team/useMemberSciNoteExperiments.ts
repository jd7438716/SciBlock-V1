/**
 * useMemberSciNoteExperiments — fetches experiment records for a member's SciNote.
 *
 * Layer: business logic hook (no UI).
 *
 * Calls GET /api/instructor/members/:userId/scinotes/:sciNoteId/experiments
 * (instructor-only endpoint).
 *
 * @param userId     The member's auth user ID (student.userId, NOT student.id).
 * @param sciNoteId  The SciNote (project) ID.
 *                   Pass empty string in either param to skip the fetch.
 */

import { useState, useEffect } from "react";
import { fetchMemberExperiments } from "@/api/memberSciNotes";
import type { ExperimentRecord } from "@/types/workbench";

export interface UseMemberSciNoteExperimentsResult {
  experiments: ExperimentRecord[];
  loading:     boolean;
  error:       string | null;
}

export function useMemberSciNoteExperiments(
  userId:    string | null,
  sciNoteId: string,
): UseMemberSciNoteExperimentsResult {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !sciNoteId) {
      setExperiments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMemberExperiments(userId, sciNoteId)
      .then((data) => {
        if (!cancelled) setExperiments(data);
      })
      .catch(() => {
        if (!cancelled) setError("加载实验记录失败，请重试");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, sciNoteId]);

  return { experiments, loading, error };
}
