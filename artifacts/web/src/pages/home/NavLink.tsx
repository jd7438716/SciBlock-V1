import React from "react";
import { Link } from "wouter";
import type { NavItem } from "@/config/navigation";

interface Props {
  item: NavItem;
  active: boolean;
}

export function NavLink({ item, active }: Props) {
  const { Icon, label, href } = item;
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-gray-100 text-gray-900 font-medium"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      ].join(" ")}
    >
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      {label}
    </Link>
  );
}
