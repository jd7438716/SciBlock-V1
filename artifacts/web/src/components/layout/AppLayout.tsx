import React from "react";
import { TopBar } from "./TopBar";

interface Props {
  title: string;
  children: React.ReactNode;
}

/**
 * Standard page layout: top bar + scrollable content area.
 * Must be used inside AuthenticatedLayout (which supplies the sidebar).
 */
export function AppLayout({ title, children }: Props) {
  return (
    <>
      <TopBar title={title} />
      <main className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50">
        {children}
      </main>
    </>
  );
}
