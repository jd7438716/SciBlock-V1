import React, { createContext, useContext, useState } from "react";
import type { SciNote } from "@/types/scinote";
import type { WizardFormData } from "@/types/wizardForm";
import { getExperimentName } from "@/types/experimentFields";
import { PLACEHOLDER_SCINOTES } from "@/data/scinotes";

interface SciNoteStoreContextValue {
  notes: SciNote[];
  /**
   * Create a new SciNote from wizard form data.
   * Returns the id of the newly created note.
   */
  createSciNote: (formData: WizardFormData) => string;
  /**
   * Rename an existing SciNote container.
   * Updating title here propagates everywhere that reads from the store
   * (sidebar list, TopBar, detail page fallback title).
   */
  renameSciNote: (id: string, newTitle: string) => void;
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

  return (
    <SciNoteStoreContext.Provider value={{ notes, createSciNote, renameSciNote }}>
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
