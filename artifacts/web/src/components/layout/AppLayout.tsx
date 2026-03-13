import React from "react";
import { AppSidebar } from "@/pages/home/AppSidebar";
import { TopBar } from "./TopBar";

interface Props {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: Props) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
