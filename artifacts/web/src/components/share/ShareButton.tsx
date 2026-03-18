/**
 * ShareButton — triggers the ShareModal.
 *
 * Layer: component (pure trigger, no network calls)
 *
 * A small icon button placed in content headers.
 * Receives an onClick so the parent can control modal state.
 */

import React from "react";
import { Share2 } from "lucide-react";

interface Props {
  recipientCount?: number;
  onClick: () => void;
  className?: string;
}

export function ShareButton({ recipientCount = 0, onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="分享"
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "text-xs font-medium text-gray-600 bg-white border border-gray-200",
        "hover:bg-gray-50 hover:border-gray-300 transition-colors",
        className,
      ].join(" ")}
    >
      <Share2 size={13} />
      <span>分享</span>
      {recipientCount > 0 && (
        <span className="ml-0.5 text-[10px] font-semibold text-gray-400">
          {recipientCount}
        </span>
      )}
    </button>
  );
}
