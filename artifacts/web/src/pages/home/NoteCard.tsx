import React from "react";
import { Clock } from "lucide-react";
import type { Note } from "@/types/note";

interface Props {
  note: Note;
  onClick?: (note: Note) => void;
}

export function NoteCard({ note, onClick }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(note)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(note)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
    >
      <p className="text-sm font-medium text-gray-800 mb-3 leading-snug">
        {note.title}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />
        {note.ago}
      </div>
    </div>
  );
}
