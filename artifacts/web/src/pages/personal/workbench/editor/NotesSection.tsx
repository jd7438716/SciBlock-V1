/**
 * NotesSection — free-form TipTap rich-text editor section.
 *
 * Layer: UI component (reads + writes WorkbenchContext via hooks).
 *
 * Extracted from EditorPanel so that EditorPanel can compose it alongside
 * the structured module section cards without a single giant file.
 *
 * Responsibilities:
 *   - Initialise TipTap with StarterKit
 *   - Register / unregister the editor-insert bridge with WorkbenchContext
 *     (allows AI assist and flow-draft to push HTML into the editor)
 *   - Sync content back to context via updateEditorContent
 *   - Reload when the user switches to a different record
 *   - Show a placeholder prompt when the editor is empty
 *
 * Does NOT contain toolbar UI — that is deferred to a future phase.
 */

import React, { useEffect } from "react";
import { FileText } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useWorkbench } from "@/contexts/WorkbenchContext";

export function NotesSection() {
  const {
    currentRecord,
    updateEditorContent,
    registerEditorInsert,
    unregisterEditorInsert,
    flowDraftInserted,
  } = useWorkbench();

  const editor = useEditor({
    extensions: [StarterKit],
    content: currentRecord.editorContent || "",
    onUpdate: ({ editor }) => {
      updateEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none outline-none min-h-[120px] px-6 py-4 text-gray-800 leading-relaxed focus:outline-none",
      },
    },
  });

  // Reload editor when switching to a different record
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== currentRecord.editorContent) {
      editor.commands.setContent(currentRecord.editorContent || "");
    }
  }, [currentRecord.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register insert bridge so AI / flow-draft can push HTML into this editor
  useEffect(() => {
    if (!editor) return;

    function insertAtTop(html: string) {
      editor?.commands.insertContentAt(0, html);
    }

    registerEditorInsert(insertAtTop);
    return () => unregisterEditorInsert();
  }, [editor, registerEditorInsert, unregisterEditorInsert]);

  const isEmpty =
    !currentRecord.editorContent ||
    currentRecord.editorContent === "<p></p>" ||
    currentRecord.editorContent === "";

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        <FileText size={13} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">实验笔记</span>
        {flowDraftInserted && (
          <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
            流程草稿已生成
          </span>
        )}
      </div>

      {/* Editor area */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-4 left-6 right-6 pointer-events-none text-sm text-gray-300 italic leading-relaxed">
            在此记录实验过程、现象观察和结论…<br />
            确认所有本体模块后将自动生成流程草稿。
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
