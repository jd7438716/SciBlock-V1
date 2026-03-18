/**
 * UserInfoPopover — displays basic user information in a popover.
 *
 * Layer: component (pure display, receives data as props)
 *
 * Shown when the user clicks a recipient avatar in SharedWithAvatars.
 * Fields that are empty in the database are shown as "暂未填写".
 */

import React, { useRef, useEffect } from "react";
import { X, Mail, GraduationCap, BookOpen, User } from "lucide-react";
import type { ShareRecipient } from "@/types/share";

// ---------------------------------------------------------------------------
// User profile fields shown in the popover
// ---------------------------------------------------------------------------

interface UserProfile {
  name: string;
  email: string;
  institution?: string;
  department?: string;
  supervisorName?: string;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-4 h-4 flex-shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
        <p className={["text-sm leading-snug", value ? "text-gray-800" : "text-gray-300"].join(" ")}>
          {value || "暂未填写"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover component
// ---------------------------------------------------------------------------

interface Props {
  recipient: ShareRecipient;
  profile?: UserProfile;
  anchorRect?: DOMRect | null;
  onClose: () => void;
}

export function UserInfoPopover({ recipient, profile, anchorRect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  // Close on Escape.
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const initials = recipient.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className="absolute z-50 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ top: (anchorRect?.bottom ?? 0) + 8, left: anchorRect?.left ?? 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-700">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{recipient.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      </div>

      {/* Info rows */}
      <div className="space-y-3">
        <InfoRow icon={<Mail size={12} />} label="邮箱" value={recipient.email} />
        <InfoRow icon={<GraduationCap size={12} />} label="学校" value={profile?.institution} />
        <InfoRow icon={<BookOpen size={12} />} label="专业" value={profile?.department} />
        <InfoRow icon={<User size={12} />} label="导师" value={profile?.supervisorName} />
      </div>
    </div>
  );
}
