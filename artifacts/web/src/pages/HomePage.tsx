import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryBox } from "./home/QueryBox";
import { RecentNotes } from "./home/RecentNotes";
import { useRecentExperimentFeed } from "@/hooks/useRecentExperimentFeed";
import type { RecentExperimentItem } from "@/types/recentExperiment";

export function HomePage() {
  const [, navigate] = useLocation();
  const { items, loading, error } = useRecentExperimentFeed(8);

  function handleQuery(query: string) {
    console.log("Query submitted:", query);
  }

  function handleItemClick(item: RecentExperimentItem) {
    navigate(
      `/personal/experiment/${item.sciNoteId}/workbench?experimentId=${item.experimentId}`,
    );
  }

  return (
    <AppLayout title="主页">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">欢迎回来 👋</h1>
      <QueryBox onSubmit={handleQuery} />
      <RecentNotes
        items={items}
        loading={loading}
        error={error}
        onItemClick={handleItemClick}
      />
    </AppLayout>
  );
}
