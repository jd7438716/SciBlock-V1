import React from "react";
import { useLocation } from "wouter";
import { LayoutGrid } from "lucide-react";
import { TOP_NAV, NAV_GROUPS } from "@/config/navigation";
import { NavLink } from "./NavLink";

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-52 flex-shrink-0 h-screen bg-white border-r border-gray-100 flex flex-col py-4">
      <div className="px-4 mb-5 flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
          <LayoutGrid size={13} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          SciBlock
        </span>
      </div>

      <nav className="px-2 flex flex-col gap-0.5">
        {TOP_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={location === item.href} />
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-4 flex-1 overflow-y-auto px-2">
        {NAV_GROUPS.filter((g) => g.items.length > 0).map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1 text-xs font-medium text-gray-400 tracking-wide">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={location === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
