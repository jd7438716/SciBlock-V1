import React from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen } from "lucide-react";
import { useExperimentWizard } from "@/hooks/useExperimentWizard";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { WizardShell } from "./new-experiment/WizardShell";

/**
 * ReinitializeExperimentPage — re-runs the initialization wizard for an
 * existing SciNote, overwriting its formData while preserving all identity
 * fields (id, title, kind, createdAt).
 *
 * Responsibilities specific to this page (vs. NewExperimentPage):
 *   - Looks up the existing note by URL param
 *   - On finish: calls reinitializeSciNote → navigates back to the detail page
 *   - No draft sidebar entry (the note already appears in the sidebar list)
 */
export function ReinitializeExperimentPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { notes, reinitializeSciNote } = useSciNoteStore();

  const wizard = useExperimentWizard();
  const note = notes.find((n) => n.id === id);

  if (!note) {
    return (
      <AppLayout title="重新初始化">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen size={36} className="text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-500">
            找不到该 SciNote，无法重新初始化
          </p>
        </div>
      </AppLayout>
    );
  }

  function handleFinish() {
    reinitializeSciNote(id, wizard.form.data);
    navigate(`/personal/experiment/${id}`);
  }

  const navHeader = (
    <div className="mb-4 px-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        重新初始化
      </p>
      <p className="text-xs text-gray-500 mt-1 truncate leading-tight" title={note.title}>
        {note.title}
      </p>
    </div>
  );

  return (
    <WizardShell
      wizard={wizard}
      navHeader={navHeader}
      finishLabel="完成重新初始化"
      onFinish={handleFinish}
    />
  );
}
