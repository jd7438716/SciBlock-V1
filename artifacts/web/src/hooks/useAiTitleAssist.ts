import { useState, useEffect } from "react";
import { mockPurposeAssist } from "@/data/workbenchUtils";
import { useWorkbench } from "@/contexts/WorkbenchContext";

/**
 * useAiTitleAssist
 *
 * Manages all state and logic for the AI title assist popover.
 * Extracted from WorkbenchContext so that the context is not burdened
 * with pure UI / interaction state.
 *
 * Reads updateTitle, setModuleHighlights, savePurposeInput, insertIntoEditor,
 * and currentRecord.id from WorkbenchContext. Auto-closes when the active
 * experiment record changes (replaces the setAiAssistOpen(false) calls that
 * previously lived inside switchRecord / moveToTrash / createNewRecord).
 *
 * Consumers: ExperimentHeader (calls the hook), ExperimentTitleAssist (props).
 */
export function useAiTitleAssist() {
  const {
    currentRecord,
    updateTitle,
    setModuleHighlights,
    savePurposeInput,
    insertIntoEditor,
  } = useWorkbench();

  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [purposeInput, setPurposeInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-close and clear when the user switches to a different experiment.
  useEffect(() => {
    setAiAssistOpen(false);
    setPurposeInput("");
  }, [currentRecord.id]);

  function runAiAssist() {
    if (!purposeInput.trim() || isGenerating) return;
    setIsGenerating(true);

    setTimeout(() => {
      const result = mockPurposeAssist(purposeInput);

      updateTitle(result.generatedTitle);
      setModuleHighlights(result.highlightedModuleKeys);

      const purposeHtml = `<h3>实验目的</h3><p>${result.purposeDraft}</p><hr>`;
      insertIntoEditor(purposeHtml);

      savePurposeInput(purposeInput);
      setIsGenerating(false);
      setAiAssistOpen(false);
      setPurposeInput("");
    }, 900);
  }

  return {
    aiAssistOpen,
    setAiAssistOpen,
    purposeInput,
    setPurposeInput,
    isGenerating,
    runAiAssist,
  };
}
