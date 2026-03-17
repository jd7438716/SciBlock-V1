/**
 * useMemberSciNotes — fetches all SciNotes owned by a specific member.
 *
 * Layer: business logic hook (no UI).
 *
 * Calls GET /api/instructor/members/:userId/scinotes (instructor-only endpoint).
 *
 * @param userId  The member's auth user ID (student.userId, NOT student.id).
 *                Pass null or empty string to skip the fetch (e.g. student hasn't
 *                accepted their invite yet, so no user account exists).
 */

import { useState, useEffect } from "react";
import { fetchMemberSciNotes } from "@/api/memberSciNotes";
import type { SciNote } from "@/types/scinote";

export interface UseMemberSciNotesResult {
  notes:   SciNote[];
  loading: boolean;
  error:   string | null;
}

export function useMemberSciNotes(userId: string | null): UseMemberSciNotesResult {
  const [notes,   setNotes]   = useState<SciNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMemberSciNotes(userId)
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .catch(() => {
        if (!cancelled) setError("加载该成员的项目列表失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { notes, loading, error };
}
