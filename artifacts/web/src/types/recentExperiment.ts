/**
 * RecentExperimentItem — the view-model type for the home page "最近实验" feed.
 *
 * This is the ONLY type that feed hooks, cards, and the RecentNotes section
 * should consume. Raw API shapes stay inside api/recentExperiments.ts.
 *
 * Field contract:
 *   - experimentId / sciNoteId  used for navigation
 *   - experimentTitle           primary card heading
 *   - sciNoteTitle              secondary line (parent project name)
 *   - effectiveTime             ISO timestamp for <time dateTime> attribute
 *   - ago                       pre-formatted relative label ("3 天前")
 */
export interface RecentExperimentItem {
  experimentId:    string;
  experimentTitle: string;
  sciNoteId:       string;
  sciNoteTitle:    string;
  effectiveTime:   string | null;
  ago:             string;
}
