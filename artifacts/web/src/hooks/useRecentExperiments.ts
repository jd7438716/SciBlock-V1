import { useMemo } from "react";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { RecentExperimentItem } from "@/types/recentExperiment";

/** Default number of items to surface on the home page. */
const DEFAULT_LIMIT = 8;

/**
 * Derives the single effective timestamp for a SciNote.
 * Rule (defined here only, not scattered elsewhere):
 *   effectiveTime = updatedAt ?? createdAt ?? null
 *
 * Used for BOTH sorting and display — the two are always consistent.
 */
function effectiveTime(
  updatedAt?: string | null,
  createdAt?: string | null,
): string | null {
  return updatedAt ?? createdAt ?? null;
}

/**
 * useRecentExperiments — selects the most-recently-updated SciNotes for the
 * home page card list.
 *
 * Data flow:
 *   SciNoteStoreContext (notes[], loading) →
 *   sort by effectiveTime desc (updatedAt ?? createdAt) →
 *   slice(0, limit) →
 *   map to RecentExperimentItem →
 *   returned to caller
 *
 * Contract:
 *   - Sorting and display always use the same timestamp (effectiveTime).
 *   - The time rule is defined once in this file — not in the type, not in
 *     the component.
 *   - Never modifies SciNoteStoreContext.
 *   - `loading` is forwarded so the page can render a skeleton.
 */
export function useRecentExperiments(limit = DEFAULT_LIMIT): {
  items: RecentExperimentItem[];
  loading: boolean;
} {
  const { notes, loading } = useSciNoteStore();

  const items = useMemo<RecentExperimentItem[]>(() => {
    return [...notes]
      .sort((a, b) => {
        const ta = new Date(effectiveTime(a.updatedAt, a.createdAt) ?? 0).getTime();
        const tb = new Date(effectiveTime(b.updatedAt, b.createdAt) ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, limit)
      .map((note) => {
        const ts = effectiveTime(note.updatedAt, note.createdAt);
        return {
          id: note.id,
          title: note.title?.trim() || "未命名实验",
          subtitle: note.experimentType?.trim() || null,
          effectiveTime: ts,
          ago: formatRelativeTime(ts),
        };
      });
  }, [notes, limit]);

  return { items, loading };
}
