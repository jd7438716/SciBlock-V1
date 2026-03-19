/**
 * experimentSelectors.ts — pure predicate functions for ExperimentRecord
 * business rules.
 *
 * Layer: utils / domain selectors
 *
 * Rules:
 *   - No side-effects, no imports of React or UI libraries.
 *   - Accept ExperimentRecord (or a Pick<> of it) — never raw string values.
 *   - Replace all inline `record.confirmationState === "confirmed_dirty"`
 *     bare checks in components with the named functions below.
 *
 * Usage:
 *   import { isDirtyRecord, hasBeenConfirmed } from "@/utils/experimentSelectors";
 */

import type { ExperimentRecord, ConfirmationState } from "@/types/experiment";

/** Minimal shape required by most selectors. */
type WithConfirmationState = Pick<ExperimentRecord, "confirmationState">;

// ---------------------------------------------------------------------------
// Confirmation-state selectors
// ---------------------------------------------------------------------------

/**
 * Returns true when the record has been confirmed at least once and the
 * current modules differ from the confirmed snapshot.
 * UI meaning: "amber warning — please re-confirm".
 */
export function isDirtyRecord(record: WithConfirmationState): boolean {
  return record.confirmationState === "confirmed_dirty";
}

/**
 * Returns true when the record has been confirmed at least once
 * (regardless of whether it has been edited since).
 * Covers both "confirmed" and "confirmed_dirty".
 * UI meaning: heritable-module hint should be shown.
 */
export function hasBeenConfirmed(record: WithConfirmationState): boolean {
  return record.confirmationState === "confirmed" ||
         record.confirmationState === "confirmed_dirty";
}

/**
 * Returns true when the record is in the clean "confirmed" state —
 * confirmed and not edited since.
 * UI meaning: green badge, confirm button disabled.
 */
export function isConfirmedClean(record: WithConfirmationState): boolean {
  return record.confirmationState === "confirmed";
}

/**
 * Returns true when the record has never been confirmed.
 * UI meaning: "确认保存" primary CTA.
 */
export function isDraftRecord(record: WithConfirmationState): boolean {
  return record.confirmationState === "draft";
}

// ---------------------------------------------------------------------------
// Confirmation-state label (instructor read-only view)
// ---------------------------------------------------------------------------

/** Maps ConfirmationState to a human-readable Chinese label for instructor view. */
export const CONFIRMATION_STATE_LABELS: Record<ConfirmationState, string> = {
  draft:            "草稿阶段（尚未确认）",
  confirmed:        "已确认",
  confirmed_dirty:  "已确认（内容有更新）",
};

// ---------------------------------------------------------------------------
// Chain identity selectors
// ---------------------------------------------------------------------------

/**
 * Returns true when the record is persisted on the server
 * (has a real UUID, not a local temp ID like "rec_...").
 */
export function isPersistedRecord(record: Pick<ExperimentRecord, "id">): boolean {
  return record.id.includes("-") && !record.id.startsWith("rec_");
}
