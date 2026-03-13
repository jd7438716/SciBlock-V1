import React from "react";
import { RotateCcw } from "lucide-react";
import { NoteCard } from "./NoteCard";
import type { Note } from "@/types/note";

interface Props {
  notes: Note[];
  onNoteClick?: (note: Note) => void;
}

export function RecentNotes({ notes, onNoteClick }: Props) {
  if (notes.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw size={15} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-700">最近笔记</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-2xl">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onClick={onNoteClick} />
        ))}
      </div>
    </section>
  );
}
