import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryBox } from "./home/QueryBox";
import { RecentNotes } from "./home/RecentNotes";
import type { Note } from "@/types/note";

// Placeholder data — replace with API call when the notes backend is ready.
const PLACEHOLDER_NOTES: Note[] = [
  { id: 1, title: "Material characterization report", ago: "8 days ago" },
  { id: 2, title: "test", ago: "13 days ago" },
];

export function HomePage() {
  const notes = PLACEHOLDER_NOTES;

  function handleQuery(query: string) {
    // TODO: wire up to AI / search API
    console.log("Query submitted:", query);
  }

  function handleNoteClick(note: Note) {
    // TODO: navigate to note detail
    console.log("Note clicked:", note.id);
  }

  return (
    <AppLayout title="主页">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">欢迎回来 👋</h1>
      <QueryBox onSubmit={handleQuery} />
      <RecentNotes notes={notes} onNoteClick={handleNoteClick} />
    </AppLayout>
  );
}
