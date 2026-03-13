import React, { createContext, useContext, useState } from "react";
import type { SciNote } from "@/types/scinote";
import type { WizardFormData } from "@/types/wizardForm";
import { getExperimentName } from "@/types/experimentFields";
import { PLACEHOLDER_SCINOTES } from "@/data/scinotes";

interface SciNoteStoreContextValue {
  notes: SciNote[];
  /** Create a new SciNote from wizard form data. Returns the new id. */
  createSciNote: (formData: WizardFormData) => string;
  /**
   * Rename an existing SciNote container.
   * Only title changes — formData is untouched.
   */
  renameSciNote: (id: string, newTitle: string) => void;
  /**
   * Overwrite the formData of an existing SciNote with fresh wizard output.
   * The note's id, title, kind, and createdAt are all preserved.
   */
  reinitializeSciNote: (id: string, newFormData: WizardFormData) => void;
  /** Permanently remove a SciNote from the list. */
  deleteSciNote: (id: string) => void;
}

const SciNoteStoreContext = createContext<SciNoteStoreContextValue | null>(null);

export function SciNoteStoreProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<SciNote[]>(PLACEHOLDER_SCINOTES);

  function createSciNote(formData: WizardFormData): string {
    const id = `exp-${Date.now()}`;
    const newNote: SciNote = {
      id,
      title: getExperimentName(formData.step2.fields) || "未命名实验",
      kind: "wizard",
      createdAt: new Date().toISOString(),
      formData,
    };
    setNotes((prev) => [newNote, ...prev]);
    return id;
  }

  function renameSciNote(id: string, newTitle: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: newTitle } : n)),
    );
  }

  function reinitializeSciNote(id: string, newFormData: WizardFormData) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              // Preserve identity fields; replace only the wizard content.
              formData: newFormData,
              // Always keep kind as "wizard" after reinit.
              kind: "wizard",
            }
          : n,
      ),
    );
  }

  function deleteSciNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <SciNoteStoreContext.Provider
      value={{ notes, createSciNote, renameSciNote, reinitializeSciNote, deleteSciNote }}
    >
      {children}
    </SciNoteStoreContext.Provider>
  );
}

export function useSciNoteStore(): SciNoteStoreContextValue {
  const ctx = useContext(SciNoteStoreContext);
  if (!ctx) {
    throw new Error("useSciNoteStore must be used inside SciNoteStoreProvider");
  }
  return ctx;
}
