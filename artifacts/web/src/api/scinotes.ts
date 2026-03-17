/**
 * api/scinotes.ts — REST client for the SciNote CRUD endpoints.
 *
 * Adapter rules enforced here (mirrors the recentExperiments adapter pattern):
 *   - ApiSciNote is intentionally NOT exported; it stops at this file.
 *   - normalizeSciNote() is intentionally NOT exported.
 *   - All public functions return the frontend domain type SciNote (or void),
 *     never the raw ApiSciNote. Callers never see the wire format.
 *
 * All calls proxy through Express → Go API.
 * The Bearer token is injected automatically by apiFetch via localStorage.
 */

import type { SciNote } from "@/types/scinote";
import type { WizardFormData } from "@/types/wizardForm";
import { apiFetch } from "./client";

// ---------------------------------------------------------------------------
// Raw API shape — internal only, never exported
// ---------------------------------------------------------------------------

interface ApiSciNote {
  id: string;
  userId: string;
  title: string;
  kind: string;
  experimentType: string | null;
  objective: string | null;
  formData: WizardFormData | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiListSciNotesResponse {
  items: ApiSciNote[];
  total: number;
}

// ---------------------------------------------------------------------------
// Normalize — adapts raw API shape to the frontend domain type.
// Internal only, not exported.
// ---------------------------------------------------------------------------

function normalizeSciNote(raw: ApiSciNote): SciNote {
  return {
    id:             raw.id,
    title:          raw.title,
    kind:           raw.kind === "wizard" ? "wizard" : "placeholder",
    createdAt:      raw.createdAt,
    updatedAt:      raw.updatedAt,
    experimentType: raw.experimentType ?? undefined,
    objective:      raw.objective ?? undefined,
    formData:       raw.formData ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API — all functions return SciNote (or void), never ApiSciNote
// ---------------------------------------------------------------------------

/** GET /api/scinotes — list all non-deleted SciNotes for the current user. */
export async function listSciNotes(): Promise<SciNote[]> {
  const res = await apiFetch<ApiListSciNotesResponse>("/scinotes");
  return res.items.map(normalizeSciNote);
}

/** GET /api/scinotes/:id — fetch a single SciNote. */
export async function getSciNote(id: string): Promise<SciNote> {
  const raw = await apiFetch<ApiSciNote>(`/scinotes/${id}`);
  return normalizeSciNote(raw);
}

/** POST /api/scinotes — create a new SciNote. */
export async function createSciNoteApi(body: {
  title: string;
  kind: string;
  experimentType?: string;
  objective?: string;
  formData?: WizardFormData;
}): Promise<SciNote> {
  const raw = await apiFetch<ApiSciNote>("/scinotes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeSciNote(raw);
}

/** PATCH /api/scinotes/:id — partial update (all fields optional). */
export async function updateSciNote(
  id: string,
  patch: {
    title?: string;
    experimentType?: string;
    objective?: string;
    formData?: WizardFormData;
  },
): Promise<SciNote> {
  const raw = await apiFetch<ApiSciNote>(`/scinotes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return normalizeSciNote(raw);
}

/** DELETE /api/scinotes/:id — soft-delete (moves to trash). */
export function deleteSciNoteApi(id: string): Promise<void> {
  return apiFetch<void>(`/scinotes/${id}`, { method: "DELETE" });
}
