import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { LayoutGrid, Plus, BookOpen } from "lucide-react";
import { TOP_NAV, NAV_GROUPS } from "@/config/navigation";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { useNewExperimentDraft } from "@/contexts/NewExperimentDraftContext";
import { NavLink } from "./NavLink";
import { SciNoteRow } from "./SciNoteRow";
import type { NavItem, NavGroup } from "@/config/navigation";

const DRAFT_FALLBACK = "未命名实验";

/** Resolve the detail-page href for a SciNote based on its kind. */
function sciNoteHref(kind: "placeholder" | "wizard", id: string): string {
  return kind === "wizard"
    ? `/personal/experiment/${id}`
    : `/personal/note/${id}`;
}

function GroupHeader({ group }: { group: NavGroup }) {
  return (
    <div className="flex items-center justify-between px-3 mb-1">
      <span className="text-xs font-medium text-gray-400 tracking-wide">
        {group.title}
      </span>
      {group.action && (
        <Link
          href={group.action.href}
          title={group.action.label}
          className="text-gray-400 hover:text-gray-700 transition-colors rounded p-0.5 hover:bg-gray-100"
        >
          <Plus size={13} />
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const [location] = useLocation();
  const { notes, renameSciNote } = useSciNoteStore();
  const { draftName } = useNewExperimentDraft();

  // Tracks which SciNote (by id) is currently being renamed inline.
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // More-menu action handlers
  // ---------------------------------------------------------------------------

  function handleRenameRequest(noteId: string) {
    setRenamingNoteId(noteId);
  }

  function handleRenameCommit(noteId: string, newTitle: string) {
    renameSciNote(noteId, newTitle);
    setRenamingNoteId(null);
  }

  function handleRenameCancel() {
    setRenamingNoteId(null);
  }

  function handleReinitialize(noteId: string) {
    // TODO: navigate back to wizard or open re-init flow
    console.log("[SciNote] reinitialize:", noteId);
  }

  function handleDelete(noteId: string) {
    // TODO: show confirm dialog → call store.deleteSciNote(noteId)
    console.log("[SciNote] delete:", noteId);
  }

  // ---------------------------------------------------------------------------
  // Build nav groups with dynamic 个人 items
  // ---------------------------------------------------------------------------

  const draftItem: NavItem | null =
    draftName !== null
      ? {
          label: draftName.trim() || DRAFT_FALLBACK,
          href: "/personal/new-experiment",
          Icon: BookOpen,
        }
      : null;

  const groups: NavGroup[] = NAV_GROUPS.map((g) =>
    g.title === "个人" ? { ...g, items: draftItem ? [draftItem] : [] } : g,
  );

  return (
    <aside className="w-52 flex-shrink-0 h-screen bg-white border-r border-gray-100 flex flex-col py-4">
      {/* Logo */}
      <div className="px-4 mb-5 flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
          <LayoutGrid size={13} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          SciBlock
        </span>
      </div>

      {/* Top-level flat nav */}
      <nav className="px-2 flex flex-col gap-0.5">
        {TOP_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={location === item.href} />
        ))}
      </nav>

      {/* Group sections (团队, 个人) */}
      <div className="mt-4 flex flex-col gap-4 flex-1 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.title}>
            <GroupHeader group={group} />
            <div className="flex flex-col gap-0.5">

              {/* Draft entry (no more-menu — wizard still in progress) */}
              {group.title === "个人" && draftItem && (
                <NavLink
                  key={draftItem.href}
                  item={draftItem}
                  active={location === draftItem.href}
                />
              )}

              {/* Saved SciNotes — with inline rename + more-menu */}
              {group.title === "个人" &&
                notes.map((note) => {
                  const href = sciNoteHref(note.kind, note.id);
                  return (
                    <SciNoteRow
                      key={note.id}
                      noteId={note.id}
                      title={note.title}
                      href={href}
                      active={location === href}
                      isRenaming={renamingNoteId === note.id}
                      onRenameRequest={handleRenameRequest}
                      onRenameCommit={(newTitle) =>
                        handleRenameCommit(note.id, newTitle)
                      }
                      onRenameCancel={handleRenameCancel}
                      onReinitialize={handleReinitialize}
                      onDelete={handleDelete}
                    />
                  );
                })}

              {/* Other groups (团队, etc.) — static config items */}
              {group.title !== "个人" &&
                group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={location === item.href}
                  />
                ))}

            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
