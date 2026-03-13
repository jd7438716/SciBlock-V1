import React from "react";
import { Bell } from "lucide-react";

interface Props {
  title: string;
}

export function TopBar({ title }: Props) {
  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-gray-100 bg-white flex-shrink-0">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Bell size={16} />
        </button>
        <div
          aria-label="User avatar"
          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 select-none"
        >
          U
        </div>
      </div>
    </header>
  );
}
