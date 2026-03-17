/**
 * RecentExperimentItem — the minimal shape used by the home page's
 * "recent experiments" card list.
 *
 * Derived from ApiSciNote / SciNote by useRecentExperiments.
 * Components that render these cards should import from here, not from
 * the raw API types, to keep the boundary explicit.
 */
export interface RecentExperimentItem {
  /** SciNote UUID — used as the navigate target: /personal/experiment/:id */
  id: string;
  /** Display title; falls back to "未命名实验" if blank */
  title: string;
  /** Optional subtitle shown below the title (experimentType or kind) */
  subtitle: string | null;
  /** ISO timestamp of the most recent update */
  updatedAt: string;
  /** Pre-formatted relative time label, e.g. "3 天前" */
  ago: string;
}
