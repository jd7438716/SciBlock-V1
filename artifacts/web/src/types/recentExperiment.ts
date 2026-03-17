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
  /** Optional subtitle shown below the title (experimentType) */
  subtitle: string | null;
  /**
   * The best available timestamp for this record:
   *   updatedAt ?? createdAt ?? null
   *
   * Named "effectiveTime" rather than "updatedAt" because the source may
   * be createdAt when updatedAt is absent. Consumers must not assume this
   * is strictly the last-modified time.
   */
  effectiveTime: string | null;
  /** Pre-formatted relative time label, e.g. "3 天前". "—" when no time available. */
  ago: string;
}
