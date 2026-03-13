import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { LayoutGrid, Plus, BookOpen } from "lucide-react";
import { TOP_NAV, NAV_GROUPS } from "@/config/navigation";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import { useNewExperimentDraft } from "@/contexts/NewExperimentDraftContext";
import { NavLink } from "./NavLink";
import { SciNoteRow } from "./SciNoteRow";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { NavItem, NavGroup } from "@/config/navigation";

const DRAFT_FALLBACK = "未命名实验";

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
  const [location, navigate] = useLocation();
  const { notes, renameSciNote } = useSciNoteStore();
  const { draftName } = useNewExperimentDraft();

  // Tracks which SciNote (by id) is currently being renamed inline.
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);

  // Tracks which SciNote is pending confirmation for reinitialization.
  const [reinitConfirmNoteId, setReinitConfirmNoteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Rename handlers
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

  // ---------------------------------------------------------------------------
  // Reinitialize handlers
  // ---------------------------------------------------------------------------

  function handleReinitRequest(noteId: string) {
    setReinitConfirmNoteId(noteId);
  }

  function handleReinitConfirm() {
    if (!reinitConfirmNoteId) return;
    const targetId = reinitConfirmNoteId;
    setReinitConfirmNoteId(null);
    navigate(`/personal/reinitialize/${targetId}`);
  }

  function handleReinitCancel() {
    setReinitConfirmNoteId(null);
  }

  // ---------------------------------------------------------------------------
  // Delete handler (stub)
  // ---------------------------------------------------------------------------

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

  // Find the note targeted for reinitialization (for the confirm dialog text).
  const reinitNote = reinitConfirmNoteId
    ? notes.find((n) => n.id === reinitConfirmNoteId)
    : null;

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
                      onReinitialize={handleReinitRequest}
                      onDelete={handleDelete}
                    />
                  );
                })}

              {/* Other groups (团队, etc.) */}
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

      {/* Reinitialization confirmation dialog */}
      <ConfirmDialog
        open={reinitConfirmNoteId !== null}
        title="重新初始化"
        description={
          reinitNote
            ? `将清空「${reinitNote.title}」的初始化内容，重新填写步骤 1–6。名称将被保留，该 SciNote 不会被删除。`
            : "将清空当前 SciNote 的初始化内容，但不会删除该 SciNote。确认继续？"
        }
        confirmLabel="确认重新初始化"
        cancelLabel="取消"
        danger
        onConfirm={handleReinitConfirm}
        onCancel={handleReinitCancel}
      />
    </aside>
  );
}
