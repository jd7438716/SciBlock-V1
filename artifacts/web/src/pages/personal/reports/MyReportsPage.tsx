import React, { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReportListPanel } from "./ReportListPanel";
import { ReportWorkPanel } from "./ReportWorkPanel";
import { GenerateReportWizard } from "./wizard/GenerateReportWizard";
import { AiReportDetailPanel } from "./detail/AiReportDetailPanel";
import { useMyReports, useCurrentStudentProfile, getCurrentWeekDefaults } from "@/hooks/reports/useMyReports";
import { useCurrentUser } from "@/contexts/UserContext";
import type { WeeklyReport } from "@/types/weeklyReport";
import { fmtDate, isAiGenerated } from "@/types/weeklyReport";

// ---------------------------------------------------------------------------
// New report dialog (inline, manual)
// ---------------------------------------------------------------------------
interface NewReportDialogProps {
  onConfirm: (title: string, weekStart: string, weekEnd: string) => void;
  onCancel: () => void;
}

function NewReportForm({ onConfirm, onCancel }: NewReportDialogProps) {
  const { weekStart, weekEnd } = getCurrentWeekDefaults();
  const [title, setTitle] = useState(`周报 ${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`);
  const [ws, setWs] = useState(weekStart);
  const [we, setWe] = useState(weekEnd);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-96">
        <h3 className="text-base font-semibold text-gray-800 mb-4">新建周报</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={ws}
                onChange={(e) => setWs(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={we}
                onChange={(e) => setWe(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onConfirm(title.trim() || "新周报", ws, we)}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              创建草稿
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right panel mode
// ---------------------------------------------------------------------------
type RightMode = "empty" | "new-form" | "wizard" | "work" | "ai-detail";

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function MyReportsPage() {
  const { currentUser } = useCurrentUser();
  const { profile, loading: profileLoading, error: profileError } = useCurrentStudentProfile();
  const { reports, loading: reportsLoading, reload, create, save, submit, remove } = useMyReports(
    profile?.id ?? null,
  );
  const search = useSearch();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightMode, setRightMode] = useState<RightMode>("empty");

  const userId = currentUser?.id ?? "";
  const studentId = profile?.id ?? "";
  const studentName = profile?.name ?? "我";
  const loading = profileLoading || reportsLoading;

  // Auto-select when ?reportId=xxx is in URL (e.g. from message notification)
  useEffect(() => {
    const params = new URLSearchParams(search ?? "");
    const reportId = params.get("reportId");
    if (reportId) {
      setSelectedId(reportId);
      setRightMode("work"); // will be overridden to ai-detail if needed (see below)
    }
  }, [search]);

  // Derive right panel mode based on selected report
  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (rightMode === "wizard" || rightMode === "new-form") return;
    if (!selectedReport) {
      setRightMode("empty");
    } else if (isAiGenerated(selectedReport)) {
      setRightMode("ai-detail");
    } else {
      setRightMode("work");
    }
  }, [selectedReport?.id, selectedReport?.generationStatus]);

  const handleSelect = (r: WeeklyReport) => {
    setSelectedId(r.id);
    if (isAiGenerated(r)) {
      setRightMode("ai-detail");
    } else {
      setRightMode("work");
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setRightMode("new-form");
  };

  const handleAiGenerate = () => {
    setSelectedId(null);
    setRightMode("wizard");
  };

  const handleNewConfirm = async (title: string, weekStart: string, weekEnd: string) => {
    const report = await create(title, weekStart, weekEnd);
    setSelectedId(report.id);
    setRightMode("work");
  };

  const handleWizardComplete = async (report: WeeklyReport) => {
    // Reload the full list so the new report appears
    await reload();
    setSelectedId(report.id);
    setRightMode("ai-detail");
  };

  const handleWizardCancel = () => {
    setRightMode(selectedReport ? (isAiGenerated(selectedReport) ? "ai-detail" : "work") : "empty");
  };

  const handleReportUpdated = (updated: WeeklyReport) => {
    setSelectedId(updated.id);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setSelectedId(null);
    setRightMode("empty");
  };

  // Profile loading state
  if (profileLoading) {
    return (
      <AppLayout title="我的周报">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-gray-400">加载中…</p>
        </div>
      </AppLayout>
    );
  }

  // No student profile bound to this account
  if (!profile) {
    return (
      <AppLayout title="我的周报">
        <div className="flex h-full items-center justify-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8 w-96 text-center">
            <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-lg">!</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">账号未绑定学生档案</h3>
            <p className="text-sm text-gray-500">
              {profileError
                ? "加载学生档案时出错，请刷新页面重试。"
                : "你的账号尚未与学生档案关联。请联系导师完成绑定后再访问此页面。"}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="我的周报">
      <div className="flex h-full -mx-8 -my-8">
        {/* Left: report list */}
        <ReportListPanel
          reports={reports}
          selectedId={selectedId}
          onSelect={handleSelect}
          onNew={handleNew}
          onAiGenerate={handleAiGenerate}
          loading={loading}
        />

        {/* Right: mode-based panel */}
        {rightMode === "new-form" && (
          <NewReportForm
            onConfirm={handleNewConfirm}
            onCancel={() => setRightMode("empty")}
          />
        )}

        {rightMode === "wizard" && (
          <GenerateReportWizard
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}

        {(rightMode === "work" || rightMode === "empty") && (
          <ReportWorkPanel
            report={rightMode === "work" ? selectedReport : null}
            studentId={studentId}
            studentName={studentName}
            userId={userId}
            onSave={save}
            onSubmit={submit}
            onDelete={handleDelete}
            onReportUpdated={handleReportUpdated}
          />
        )}

        {rightMode === "ai-detail" && selectedReport && (
          <AiReportDetailPanel
            report={selectedReport}
            userId={userId}
            studentName={studentName}
            onDelete={handleDelete}
          />
        )}
      </div>
    </AppLayout>
  );
}
