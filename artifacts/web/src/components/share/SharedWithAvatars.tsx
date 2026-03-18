/**
 * SharedWithAvatars — row of avatar circles for content recipients.
 *
 * Layer: component (display + popover trigger)
 *
 * Shown in the header of shared content. Each circle represents one recipient.
 * Clicking a circle opens UserInfoPopover with the recipient's basic info.
 *
 * Behavior:
 *   - First two recipients are shown as full circles.
 *   - If there are more than two, a "+N" overflow indicator is shown.
 *   - Clicking any avatar opens a popover positioned below the avatar.
 *   - Clicking outside or pressing Escape closes the popover.
 */

import React, { useState, useRef, useCallback } from "react";
import { UserInfoPopover } from "./UserInfoPopover";
import type { ShareRecipient } from "@/types/share";

const MAX_VISIBLE = 3;

interface Props {
  recipients: ShareRecipient[];
  className?: string;
}

function AvatarCircle({
  name,
  title,
  onClick,
  isOverflow,
  count,
}: {
  name: string;
  title?: string;
  onClick: (rect: DOMRect) => void;
  isOverflow?: boolean;
  count?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const initials = isOverflow
    ? `+${count}`
    : name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <button
      ref={ref}
      type="button"
      title={title ?? name}
      onClick={() => {
        if (ref.current) onClick(ref.current.getBoundingClientRect());
      }}
      className={[
        "w-7 h-7 rounded-full flex items-center justify-center",
        "text-[11px] font-semibold border-2 border-white shadow-sm",
        "transition-transform hover:scale-110 focus-visible:outline-none",
        "-ml-1.5 first:ml-0",
        isOverflow
          ? "bg-gray-100 text-gray-500"
          : "bg-indigo-100 text-indigo-700",
      ].join(" ")}
    >
      {initials}
    </button>
  );
}

export function SharedWithAvatars({ recipients, className = "" }: Props) {
  const [openRecipient, setOpenRecipient] = useState<ShareRecipient | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleAvatarClick = useCallback((recipient: ShareRecipient) => (rect: DOMRect) => {
    setOpenRecipient((prev) => (prev?.shareId === recipient.shareId ? null : recipient));
    setAnchorRect(rect);
  }, []);

  const handleClose = useCallback(() => {
    setOpenRecipient(null);
    setAnchorRect(null);
  }, []);

  if (recipients.length === 0) return null;

  const visible = recipients.slice(0, MAX_VISIBLE);
  const overflow = recipients.length - MAX_VISIBLE;

  return (
    <div className={["relative flex items-center", className].join(" ")}>
      <div className="flex items-center">
        {visible.map((r) => (
          <AvatarCircle
            key={r.shareId}
            name={r.name}
            title={`已分享给 ${r.name}`}
            onClick={handleAvatarClick(r)}
          />
        ))}
        {overflow > 0 && (
          <AvatarCircle
            name=""
            isOverflow
            count={overflow}
            title={`还有 ${overflow} 人`}
            onClick={() => {}}
          />
        )}
      </div>

      {openRecipient && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="pointer-events-auto">
            <UserInfoPopover
              recipient={openRecipient}
              anchorRect={anchorRect}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
