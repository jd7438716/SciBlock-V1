import React, { useRef, useEffect } from "react";
import { useParams } from "wouter";
import { FlaskConical } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { useTrash } from "@/contexts/TrashContext";
import { WorkbenchProvider, useWorkbench } from "@/contexts/WorkbenchContext";
import { WorkbenchLayout } from "./WorkbenchLayout";
import type { ExperimentRecord } from "@/types/workbench";

// ---------------------------------------------------------------------------
// Inner layout — runs inside WorkbenchProvider to read the live title
// ---------------------------------------------------------------------------

/**
 * WorkbenchAppLayout — reads current record title from WorkbenchContext
 * and forwards it to AppLayout's title prop in real time.
 */
function WorkbenchAppLayout() {
  const { currentRecord } = useWorkbench();
  const pageTitle = currentRecord.title.trim() || "实验记录";

  return (
    <AppLayout title={pageTitle} noPadding>
      <WorkbenchLayout />
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Page entry point
// ---------------------------------------------------------------------------

/**
 * ExperimentWorkbenchPage — route /personal/experiment/:id/workbench
 *
 * WorkbenchProvider is mounted *outside* AppLayout so that WorkbenchAppLayout
 * (inside the provider) can read the live record title.
 *
 * key={id} ensures the provider re-mounts when navigating between SciNotes.
 * extraRecords seeds any records previously restored from the trash this session.
 */
export function ExperimentWorkbenchPage() {
  const { id } = useParams<{ id: string }>();
  const { notes } = useSciNoteStore();
  const { getRestoredForSciNote, clearRestoredForSciNote } = useTrash();

  // -----------------------------------------------------------------
  // Capture restored records exactly ONCE per mount via useRef.
  // Re-renders must NOT re-read the pool — that would re-inject records
  // every time the component renders, causing duplicates.
  // useRef resets to null on every remount, so each workbench visit
  // reads the pool fresh (but still only once per mount).
  // -----------------------------------------------------------------
  const extraRecordsRef = useRef<ExperimentRecord[] | null>(null);
  if (extraRecordsRef.current === null) {
    extraRecordsRef.current = getRestoredForSciNote(id);
  }

  // Clear the pool after the first render so that future remounts of this
  // page (e.g. user navigates away and comes back) start with an empty pool
  // and do NOT re-inject already-consumed records.
  // useEffect is the only safe place to call setState (i.e. clearRestoredForSciNote).
  useEffect(() => {
    clearRestoredForSciNote(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once per mount, just like the ref read above

  const note = notes.find((n) => n.id === id);

  if (!note) {
    return (
      <AppLayout title="实验记录">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FlaskConical size={36} className="text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-500">找不到该 SciNote</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <WorkbenchProvider
      key={id}
      sciNoteId={id}
      sciNoteTitle={note.title}
      extraRecords={extraRecordsRef.current}
    >
      <WorkbenchAppLayout />
    </WorkbenchProvider>
  );
}
