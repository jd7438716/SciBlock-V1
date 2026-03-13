import React from "react";
import { useParams } from "wouter";
import { FlaskConical } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { WorkbenchProvider, useWorkbench } from "@/contexts/WorkbenchContext";
import { WorkbenchLayout } from "./WorkbenchLayout";

// ---------------------------------------------------------------------------
// Inner layout — runs inside WorkbenchProvider so it can read current title
// ---------------------------------------------------------------------------

interface InnerProps {
  sciNoteTitle: string;
}

/**
 * WorkbenchAppLayout — renders AppLayout with a title that reflects the
 * current experiment record's title in real time.
 *
 * Must be a child of WorkbenchProvider to access useWorkbench().
 */
function WorkbenchAppLayout({ sciNoteTitle }: InnerProps) {
  const { currentRecord } = useWorkbench();
  const pageTitle = currentRecord.title.trim() || "实验记录";

  return (
    <AppLayout title={pageTitle} noPadding>
      <WorkbenchLayout />
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Page — thin wrapper, mounts provider, delegates everything else
// ---------------------------------------------------------------------------

/**
 * ExperimentWorkbenchPage — route entry point.
 *
 * Route: /personal/experiment/:id/workbench
 *
 * WorkbenchProvider is mounted *outside* AppLayout so that WorkbenchAppLayout
 * (inside the provider) can read the live record title and pass it to AppLayout.
 * key={id} ensures the provider re-mounts when navigating to a different SciNote.
 */
export function ExperimentWorkbenchPage() {
  const { id } = useParams<{ id: string }>();
  const { notes } = useSciNoteStore();

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
    <WorkbenchProvider key={id} sciNoteId={id}>
      <WorkbenchAppLayout sciNoteTitle={note.title} />
    </WorkbenchProvider>
  );
}
