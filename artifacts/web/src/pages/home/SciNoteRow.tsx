import React, { useRef } from "react";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { SciNoteMoreMenu } from "./SciNoteMoreMenu";

// ---------------------------------------------------------------------------
// Inline rename input — rendered in-place when the row is in renaming mode.
// ---------------------------------------------------------------------------

interface RenameInputProps {
  initialValue: string;
  onCommit: (newTitle: string) => void;
  onCancel: () => void;
}

function RenameInput({ initialValue, onCommit, onCancel }: RenameInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  function commit() {
    const val = ref.current?.value.trim() ?? "";
    if (val.length > 0) {
      onCommit(val);
    } else {
      // Empty input → revert to old name without saving.
      onCancel();
    }
  }

  return (
    <input
      ref={ref}
      type="text"
      defaultValue={initialValue}
      // autoFocus via React attribute (works reliably in portals and non-portals alike).
      autoFocus
      className="flex-1 min-w-0 text-sm text-gray-900 bg-transparent outline-none border-b border-gray-400 focus:border-gray-700 py-0 leading-tight transition-colors"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      // Save on blur so clicking elsewhere also commits the rename.
      onBlur={commit}
      // Prevent the surrounding Link from firing when clicking into the input.
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ---------------------------------------------------------------------------
// SciNoteRow
// ---------------------------------------------------------------------------

interface Props {
  noteId: string;
  title: string;
  href: string;
  active: boolean;
  /** True while the inline rename input should be displayed. */
  isRenaming: boolean;
  onRenameRequest: (noteId: string) => void;
  onRenameCommit: (newTitle: string) => void;
  onRenameCancel: () => void;
  onReinitialize: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

/**
 * SciNoteRow — sidebar list item for a saved SciNote.
 *
 * Normal mode:
 *   [BookOpen] [truncated title ................] [⋯]
 *
 * Renaming mode (isRenaming=true):
 *   [BookOpen] [<input> ___________________]
 *   The more-menu is hidden and the Link is replaced by a plain div so
 *   typing does not trigger navigation.
 */
export function SciNoteRow({
  noteId,
  title,
  href,
  active,
  isRenaming,
  onRenameRequest,
  onRenameCommit,
  onRenameCancel,
  onReinitialize,
  onDelete,
}: Props) {
  return (
    <div
      className={[
        "group flex items-center rounded-lg transition-colors",
        active ? "bg-gray-100" : "hover:bg-gray-50",
        // Slightly taller when renaming so the border-b input has room.
        isRenaming ? "py-0.5" : "",
      ].join(" ")}
    >
      {isRenaming ? (
        // Renaming mode — plain div (no navigation), inline text input.
        <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 min-w-0">
          <BookOpen size={16} className="text-gray-400 flex-shrink-0" />
          <RenameInput
            initialValue={title}
            onCommit={onRenameCommit}
            onCancel={onRenameCancel}
          />
        </div>
      ) : (
        // Normal mode — link navigates to the note detail page.
        <>
          <Link
            href={href}
            className={[
              "flex-1 flex items-center gap-2.5 px-3 py-1.5 text-sm min-w-0 transition-colors",
              active ? "text-gray-900 font-medium" : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            <BookOpen size={16} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </Link>

          <SciNoteMoreMenu
            noteId={noteId}
            onRename={onRenameRequest}
            onReinitialize={onReinitialize}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  );
}
