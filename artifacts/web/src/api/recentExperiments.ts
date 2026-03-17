/**
 * api/recentExperiments.ts — REST client for GET /api/experiments/recent.
 *
 * Adapter rules enforced here:
 *   - ApiRecentExperimentItem is intentionally NOT exported; it stops at this file.
 *   - normalizeRecentExperiment is intentionally NOT exported.
 *   - Callers (hooks, pages) only ever receive RecentExperimentItem[] from
 *     listRecentExperiments(), never the raw API shape.
 */

import { apiFetch } from "./client";
import type { RecentExperimentItem } from "@/types/recentExperiment";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

// ---------------------------------------------------------------------------
// Raw API shape — internal only, never exported
// ---------------------------------------------------------------------------

interface ApiRecentExperimentItem {
  experimentId:     string;
  experimentTitle:  string;
  sciNoteId:        string;
  sciNoteTitle:     string;
  experimentStatus: string;
  createdAt:        string;
  updatedAt:        string;
}

interface ApiListRecentResponse {
  items: ApiRecentExperimentItem[];
}

// ---------------------------------------------------------------------------
// Normalize — adapts raw API shape to the frontend view-model
// Internal only, not exported.
// ---------------------------------------------------------------------------

function normalizeRecentExperiment(raw: ApiRecentExperimentItem): RecentExperimentItem {
  const effectiveTime = raw.updatedAt ?? raw.createdAt ?? null;
  return {
    experimentId:    raw.experimentId,
    experimentTitle: raw.experimentTitle.trim() || "未命名实验",
    sciNoteId:       raw.sciNoteId,
    sciNoteTitle:    raw.sciNoteTitle.trim() || "未命名项目",
    effectiveTime,
    ago:             formatRelativeTime(effectiveTime),
  };
}

// ---------------------------------------------------------------------------
// Public API — the only export; returns normalized view-model items
// ---------------------------------------------------------------------------

export async function listRecentExperiments(limit = 8): Promise<RecentExperimentItem[]> {
  const data = await apiFetch<ApiListRecentResponse>(
    `/experiments/recent?limit=${limit}`,
  );
  return data.items.map(normalizeRecentExperiment);
}
