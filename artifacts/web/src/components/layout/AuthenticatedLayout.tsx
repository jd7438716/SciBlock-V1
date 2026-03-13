import React from "react";
import { AppSidebar } from "@/pages/home/AppSidebar";

interface Props {
  children: React.ReactNode;
}

/**
 * Shared shell for all authenticated pages.
 * Renders the persistent sidebar on the left; page content fills the right.
 * Individual pages must NOT render their own sidebar.
 */
export function AuthenticatedLayout({ children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
