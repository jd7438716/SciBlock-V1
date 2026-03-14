import type { ExperimentRecord } from "@/types/workbench";
import { makeTag } from "@/types/experimentFields";

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

/**
 * Convert a legacy free-text string into a single Tag { key, value:"" }.
 * If the string contains ":" it is split into key/value.
 */
function stringToTag(s: string) {
  const colonIdx = s.indexOf(":");
  if (colonIdx > 0 && colonIdx < s.length - 1) {
    return makeTag(s.slice(0, colonIdx).trim(), s.slice(colonIdx + 1).trim());
  }
  return makeTag(s, "");
}

/**
 * Convert a legacy string[] field to Tag[], or return the array unchanged if
 * it already contains Tag objects. No-op on undefined / null.
 */
function migrateStringArrayToTags(arr: unknown): unknown {
  if (!Array.isArray(arr) || arr.length === 0) return arr ?? [];
  if (typeof arr[0] !== "string") return arr;
  return arr.map((a) => (typeof a === "string" ? stringToTag(a) : a));
}

/**
 * Migrate all four structured-data arrays to use Tag[] for their
 * attribute / params / conditions fields.
 * Runs once on load; no-op if the data is already in the new format.
 */
function migrateModule(mod: import("@/types/workbench").OntologyModule): import("@/types/workbench").OntologyModule {
  const sd = mod.structuredData as Record<string, unknown> | undefined;
  if (!sd) return mod;

  const patch: Record<string, unknown> = {};

  // systemObjects — attributes: string[] → Tag[]
  if (Array.isArray(sd.systemObjects)) {
    const objs = (sd.systemObjects as Array<Record<string, unknown>>).map((o) => {
      const firstAttr = Array.isArray(o.attributes) ? (o.attributes as unknown[])[0] : undefined;
      return typeof firstAttr === "string"
        ? { ...o, attributes: migrateStringArrayToTags(o.attributes) }
        : o;
    });
    patch.systemObjects = objs;
  }

  // prepItems — spec/treatment/duration → attributes: Tag[]
  if (Array.isArray(sd.prepItems)) {
    const items = (sd.prepItems as Array<Record<string, unknown>>).map((p) => {
      if (Array.isArray(p.attributes) && (p.attributes.length === 0 || typeof p.attributes[0] !== "string")) {
        return p; // already Tag[]
      }
      const attrs: ReturnType<typeof makeTag>[] = [];
      if (typeof p.spec === "string" && p.spec) attrs.push(makeTag("用量/规格", p.spec));
      if (typeof p.treatment === "string" && p.treatment) attrs.push(makeTag("处理方式", p.treatment));
      if (typeof p.duration === "string" && p.duration) attrs.push(makeTag("时长", p.duration));
      if (Array.isArray(p.attributes)) attrs.push(...(migrateStringArrayToTags(p.attributes) as typeof attrs));
      const { spec: _s, treatment: _t, duration: _d, ...rest } = p;
      return { ...rest, attributes: attrs };
    });
    patch.prepItems = items;
  }

  // operationSteps — params: string → Tag[]
  if (Array.isArray(sd.operationSteps)) {
    const steps = (sd.operationSteps as Array<Record<string, unknown>>).map((s) => {
      if (Array.isArray(s.params)) return s; // already Tag[]
      const params = typeof s.params === "string" && s.params
        ? [makeTag("参数", s.params)]
        : [];
      return { ...s, params };
    });
    patch.operationSteps = steps;
  }

  // measurementItems — conditions: string → Tag[]
  if (Array.isArray(sd.measurementItems)) {
    const items = (sd.measurementItems as Array<Record<string, unknown>>).map((m) => {
      if (Array.isArray(m.conditions)) return m; // already Tag[]
      const conditions = typeof m.conditions === "string" && m.conditions
        ? [makeTag("条件", m.conditions)]
        : [];
      return { ...m, conditions };
    });
    patch.measurementItems = items;
  }

  // dataItems — unit: string → attributes: Tag[]
  if (Array.isArray(sd.dataItems)) {
    const items = (sd.dataItems as Array<Record<string, unknown>>).map((d) => {
      if (Array.isArray(d.attributes)) return d; // already Tag[]
      const attrs: ReturnType<typeof makeTag>[] = [];
      if (typeof d.unit === "string" && d.unit) attrs.push(makeTag("单位", d.unit));
      const { unit: _u, ...rest } = d;
      return { ...rest, attributes: attrs };
    });
    patch.dataItems = items;
  }

  if (Object.keys(patch).length === 0) return mod;
  return { ...mod, structuredData: { ...sd, ...patch } };
}

function migrateRecord(record: ExperimentRecord): ExperimentRecord {
  return {
    ...record,
    currentModules: record.currentModules.map(migrateModule),
  };
}

/**
 * Persistence layer for workbench experiment records.
 *
 * Storage: sessionStorage — tab-scoped, survives page refresh but not tab close.
 * Key namespace: "sciblock:workbench:<sciNoteId>" — one entry per SciNote.
 *
 * This file is the single authoritative source for workbench record I/O.
 * WorkbenchContext reads from and writes to these helpers.
 * SciNoteStoreContext calls clearWorkbenchRecords() when deleting a SciNote
 * so orphaned workbench data is cleaned up immediately.
 */

const workbenchKey = (sciNoteId: string): string =>
  `sciblock:workbench:${sciNoteId}`;

/**
 * Load persisted records for a SciNote from sessionStorage.
 * Returns [] when nothing is stored or the stored data is corrupt.
 */
export function loadWorkbenchRecords(sciNoteId: string): ExperimentRecord[] {
  try {
    const raw = sessionStorage.getItem(workbenchKey(sciNoteId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ExperimentRecord[]).map(migrateRecord);
  } catch {
    return [];
  }
}

/**
 * Save the current records list for a SciNote to sessionStorage.
 * Called from WorkbenchContext's useEffect on every records change.
 */
export function saveWorkbenchRecords(
  sciNoteId: string,
  records: ExperimentRecord[],
): void {
  try {
    sessionStorage.setItem(workbenchKey(sciNoteId), JSON.stringify(records));
  } catch {
    // sessionStorage unavailable (private mode, quota exceeded, etc.)
  }
}

/**
 * Remove the workbench storage entry for a SciNote.
 * Called by SciNoteStoreContext when a SciNote is permanently deleted,
 * so orphaned session data is cleaned up without requiring a workbench mount.
 */
export function clearWorkbenchRecords(sciNoteId: string): void {
  try {
    sessionStorage.removeItem(workbenchKey(sciNoteId));
  } catch {
    // sessionStorage unavailable
  }
}
