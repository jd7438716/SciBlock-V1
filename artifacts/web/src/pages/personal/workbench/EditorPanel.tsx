/**
 * EditorPanel — structured experiment document view (middle column).
 *
 * Layer: Page-level composition component.
 *
 * Replaces the plain TipTap textarea with a full document-style editing area:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  ExperimentDocHeader                    │  read-only metadata summary
 *   ├─────────────────────────────────────────┤
 *   │  Scrollable body:                       │
 *   │    ModuleSectionCard × 5               │  system/prep/op/meas/data
 *   │    NotesSection                         │  free-form TipTap notes
 *   └─────────────────────────────────────────┘
 *
 * Left-nav ↔ editor sync:
 *   - Clicking a section header → setActiveModuleKey (updates left nav tab)
 *   - Left nav tab change → scrolls that section into view via sectionRefs
 *
 * Each ModuleSectionCard:
 *   - Is collapsible (auto-expands when active or has data)
 *   - Delegates content rendering to ModuleBodyRenderer
 *   - Item-level edit/save/cancel is handled by the module editor components
 *   - Has confirm / reopen buttons (same semantics as OntologyModuleEditor)
 *
 * NotesSection:
 *   - TipTap rich-text editor for free-form experiment notes
 *   - Registers the editor-insert bridge for AI/flow-draft injection
 *
 * This file is intentionally thin — all business logic lives in context,
 * all UI logic lives in the sub-components.
 */

import React, { useRef, useEffect } from "react";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import { ExperimentDocHeader } from "./editor/ExperimentDocHeader";
import { ModuleSectionCard } from "./editor/ModuleSectionCard";
import { NotesSection } from "./editor/NotesSection";
import { ReportSection } from "./editor/ReportSection";
import type { OntologyModuleKey } from "@/types/workbench";

export function EditorPanel() {
  const { currentRecord, activeModuleKey } = useWorkbench();

  // Callback refs for each module section — used to scroll on nav change
  const sectionRefs = useRef<Partial<Record<OntologyModuleKey, HTMLDivElement>>>({});

  // Scroll the active module section into view when the left-nav tab changes
  useEffect(() => {
    const el = sectionRefs.current[activeModuleKey];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeModuleKey]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50 overflow-hidden">
      {/* Metadata header — fixed at top, outside the scroll area */}
      <ExperimentDocHeader />

      {/* Scrollable document body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 flex flex-col gap-3 max-w-3xl mx-auto">

          {/* Module section cards */}
          {currentRecord.currentModules.map((module) => (
            <ModuleSectionCard
              key={module.key}
              module={module}
              isActive={activeModuleKey === module.key}
              sectionRef={(el) => {
                if (el) sectionRefs.current[module.key] = el;
              }}
            />
          ))}

          {/* Free-form notes */}
          <NotesSection />

          {/* AI Report — always visible; status-driven display */}
          <ReportSection />

          {/* Bottom padding so the last card isn't flush against the edge */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
