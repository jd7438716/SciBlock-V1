import { useMemo } from "react";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { RecentExperimentItem } from "@/types/recentExperiment";

/** Default number of items to surface on the home page. */
const DEFAULT_LIMIT = 8;

/**
 * useRecentExperiments — selects the most-recently-updated SciNotes for the
 * home page card list.
 *
 * Data flow:
 *   SciNoteStoreContext (notes[], loading) →
 *   sort by updatedAt desc →
 *   slice(0, limit) →
 *   map to RecentExperimentItem (adds formatted ago, normalises title) →
 *   returned to caller
 *
 * Contract:
 *   - Never modifies SciNoteStoreContext.
 *   - All sorting / formatting logic lives here, not in the page component.
 *   - `loading` is forwarded from the context so the page can render a
 *     skeleton or suppress the section while the API call is in-flight.
 */
export function useRecentExperiments(limit = DEFAULT_LIMIT): {
  items: RecentExperimentItem[];
  loading: boolean;
} {
  const { notes, loading } = useSciNoteStore();

  const items = useMemo<RecentExperimentItem[]>(() => {
    return [...notes]
      .sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, limit)
      .map((note) => {
        const timestamp = note.updatedAt ?? note.createdAt ?? null;
        return {
          id: note.id,
          title: note.title?.trim() || "未命名实验",
          subtitle: note.experimentType?.trim() || null,
          updatedAt: timestamp ?? "",
          ago: formatRelativeTime(timestamp),
        };
      });
  }, [notes, limit]);

  return { items, loading };
}
