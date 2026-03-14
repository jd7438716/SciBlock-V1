/**
 * UtilityRail — fixed-width rightmost column with icon-based tool buttons.
 *
 * Layer: Page-level component (layout + composition only).
 *
 * Layout:
 *   [expanded panel (width varies by active tool)] | [icon column (56px)]
 *
 * Panel widths:
 *   calendar   → 280px (needs space for 7-column month grid)
 *   ai         → 192px
 *   default    → 176px
 *
 * Icons toggle their respective panels open/closed.
 * Width is CSS-transitioned for a smooth slide-in effect.
 */

import React, { useState } from "react";
import {
  CalendarDays,
  Bot,
  History,
  Paperclip,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendarPanel } from "./calendar/CalendarPanel";

// ---------------------------------------------------------------------------
// Rail config
// ---------------------------------------------------------------------------

type PanelKey = "calendar" | "ai" | "placeholder";

interface RailItem {
  key: string;
  Icon: LucideIcon;
  label: string;
  panel: PanelKey;
  /** Width of the expanded panel in px. */
  panelWidth: number;
}

const RAIL_ITEMS: RailItem[] = [
  { key: "calendar",   Icon: CalendarDays,   label: "实验日历", panel: "calendar",     panelWidth: 280 },
  { key: "ai",         Icon: Bot,            label: "AI 助手", panel: "ai",           panelWidth: 192 },
  { key: "history",    Icon: History,         label: "历史实验", panel: "placeholder",  panelWidth: 176 },
  { key: "attachment", Icon: Paperclip,       label: "附件",    panel: "placeholder",  panelWidth: 176 },
  { key: "more",       Icon: MoreHorizontal,  label: "更多",    panel: "placeholder",  panelWidth: 176 },
];

// ---------------------------------------------------------------------------
// Panel content router
// ---------------------------------------------------------------------------

function PanelContent({ item }: { item: RailItem }) {
  if (item.panel === "calendar") {
    return <CalendarPanel isOpen />;
  }
  if (item.panel === "ai") {
    return (
      <div className="p-3 text-xs text-gray-500">
        <p className="font-medium text-gray-700 mb-1">AI 助手</p>
        <p className="text-gray-400">AI 实时对话功能开发中</p>
      </div>
    );
  }
  return (
    <div className="p-3 text-xs text-gray-400">功能开发中</div>
  );
}

// ---------------------------------------------------------------------------
// UtilityRail
// ---------------------------------------------------------------------------

export function UtilityRail() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function toggle(key: string) {
    setActiveKey((prev) => (prev === key ? null : key));
  }

  const activeItem = RAIL_ITEMS.find((i) => i.key === activeKey) ?? null;

  return (
    <div className="flex flex-shrink-0">
      {/* Expanded panel — animates in from the right */}
      <div
        className="overflow-hidden transition-[width] duration-200 ease-in-out border-l border-gray-100 bg-white flex-shrink-0"
        style={{ width: activeItem ? activeItem.panelWidth : 0 }}
      >
        {activeItem && (
          <div
            className="flex flex-col h-full"
            style={{ width: activeItem.panelWidth }}
          >
            <PanelContent item={activeItem} />
          </div>
        )}
      </div>

      {/* Icon column — always visible */}
      <div className="w-14 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col items-center py-3 gap-1">
        {RAIL_ITEMS.map(({ key, Icon, label }) => (
          <button
            key={key}
            title={label}
            onClick={() => toggle(key)}
            className={[
              "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
              activeKey === key
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
            ].join(" ")}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
