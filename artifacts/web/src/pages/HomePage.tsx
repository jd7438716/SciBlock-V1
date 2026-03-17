import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryBox } from "./home/QueryBox";
import { RecentNotes } from "./home/RecentNotes";
import { useRecentExperiments } from "@/hooks/useRecentExperiments";

export function HomePage() {
  const [, navigate] = useLocation();
  const { items, loading } = useRecentExperiments(8);

  function handleQuery(query: string) {
    console.log("Query submitted:", query);
  }

  function handleItemClick(id: string) {
    navigate(`/personal/experiment/${id}`);
  }

  return (
    <AppLayout title="主页">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">欢迎回来 👋</h1>
      <QueryBox onSubmit={handleQuery} />
      <RecentNotes items={items} loading={loading} onItemClick={handleItemClick} />
    </AppLayout>
  );
}
