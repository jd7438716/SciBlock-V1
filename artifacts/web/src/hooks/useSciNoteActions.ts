import { useState } from "react";
import { useLocation } from "wouter";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import type { SciNote } from "@/types/scinote";

/** Handlers for a single action (confirm-dialog pattern). */
export interface ActionHandlers {
  request: (noteId: string) => void;
  confirm: () => void;
  cancel: () => void;
}

export interface UseSciNoteActionsResult {
  // Rename (inline input — no dialog)
  renamingNoteId: string | null;
  renameRequest: (noteId: string) => void;
  renameCommit: (noteId: string, newTitle: string) => void;
  renameCancel: () => void;

  // Reinitialize (confirm dialog → navigate to wizard)
  reinitConfirmOpen: boolean;
  reinitNote: SciNote | null;
  reinitHandlers: ActionHandlers;

  // Delete (confirm dialog → remove from store)
  deleteConfirmOpen: boolean;
  deleteNote: SciNote | null;
  deleteHandlers: ActionHandlers;
}

/**
 * Manages all three SciNote actions triggered from the sidebar:
 *   - Rename   (inline, no confirm dialog)
 *   - Reinitialize (confirm → navigate to reinitialize wizard)
 *   - Delete   (confirm → remove from store, navigate away if needed)
 *
 * Keeping this logic in a hook lets AppSidebar stay a pure layout component.
 */
export function useSciNoteActions(): UseSciNoteActionsResult {
  const [location, navigate] = useLocation();
  const { notes, renameSciNote, deleteSciNote } = useSciNoteStore();

  // ---------------------------------------------------------------------------
  // Rename
  // ---------------------------------------------------------------------------

  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);

  function renameRequest(noteId: string) {
    setRenamingNoteId(noteId);
  }

  function renameCommit(noteId: string, newTitle: string) {
    renameSciNote(noteId, newTitle);
    setRenamingNoteId(null);
  }

  function renameCancel() {
    setRenamingNoteId(null);
  }

  // ---------------------------------------------------------------------------
  // Reinitialize
  // ---------------------------------------------------------------------------

  const [reinitConfirmNoteId, setReinitConfirmNoteId] = useState<string | null>(null);
  const reinitNote = reinitConfirmNoteId
    ? (notes.find((n) => n.id === reinitConfirmNoteId) ?? null)
    : null;

  const reinitHandlers: ActionHandlers = {
    request: (noteId) => setReinitConfirmNoteId(noteId),
    confirm: () => {
      if (!reinitConfirmNoteId) return;
      const id = reinitConfirmNoteId;
      setReinitConfirmNoteId(null);
      navigate(`/personal/reinitialize/${id}`);
    },
    cancel: () => setReinitConfirmNoteId(null),
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
  const deleteNote = deleteConfirmNoteId
    ? (notes.find((n) => n.id === deleteConfirmNoteId) ?? null)
    : null;

  const deleteHandlers: ActionHandlers = {
    request: (noteId) => setDeleteConfirmNoteId(noteId),
    confirm: () => {
      if (!deleteConfirmNoteId) return;
      const id = deleteConfirmNoteId;
      setDeleteConfirmNoteId(null);

      // Navigate away if the user is currently viewing the note being deleted.
      const target = notes.find((n) => n.id === id);
      if (target) {
        const detailHref =
          target.kind === "wizard"
            ? `/personal/experiment/${id}`
            : `/personal/note/${id}`;
        const onDeletedPage =
          location === detailHref ||
          location.startsWith(`/personal/reinitialize/${id}`);
        if (onDeletedPage) navigate("/home");
      }

      deleteSciNote(id);
    },
    cancel: () => setDeleteConfirmNoteId(null),
  };

  return {
    renamingNoteId,
    renameRequest,
    renameCommit,
    renameCancel,
    reinitConfirmOpen: reinitConfirmNoteId !== null,
    reinitNote,
    reinitHandlers,
    deleteConfirmOpen: deleteConfirmNoteId !== null,
    deleteNote,
    deleteHandlers,
  };
}
