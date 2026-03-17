import { useState, useEffect, useCallback } from "react";
import { fetchTeamReports, updateReport, addReportComment } from "@/api/weeklyReport";
import type { TeamReportsResponse } from "@/api/weeklyReport";
import type { WeeklyReport, WeeklyReportStatus, AddWeeklyReportCommentPayload } from "@/types/weeklyReport";
import { getWeekMonday, getWeekSunday, addDaysToISODate } from "@/types/weeklyReport";

export interface StudentWithReport {
  id: string;
  name: string;
  status: string;
  degree: string;
  researchTopic: string;
  avatar: string | null;
  report: WeeklyReport | null;
}

interface UseTeamReportsReturn {
  weekStart: string;
  weekEnd: string;
  setWeekStart: (w: string) => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  students: StudentWithReport[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  changeStatus: (
    reportId: string,
    status: WeeklyReportStatus,
    comment?: AddWeeklyReportCommentPayload,
  ) => Promise<void>;
}

export function useTeamReports(): UseTeamReportsReturn {
  const [weekStart, setWeekStartState] = useState<string>(() =>
    getWeekMonday(new Date()),
  );
  const [data, setData] = useState<TeamReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekEnd = getWeekSunday(new Date(weekStart + "T00:00:00"));

  const load = useCallback(async (ws: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTeamReports(ws);
      setData(result);
    } catch {
      setError("加载周报失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(weekStart);
  }, [weekStart, load]);

  const setWeekStart = useCallback((w: string) => {
    setWeekStartState(w);
  }, []);

  const goToPrevWeek = useCallback(() => {
    setWeekStartState((prev) => addDaysToISODate(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStartState((prev) => addDaysToISODate(prev, 7));
  }, []);

  const students: StudentWithReport[] = (data?.students ?? []).map((s) => {
    const report =
      data?.reports.find(
        (r) => r.studentId === s.id && r.weekStart === weekStart,
      ) ?? null;
    return { ...s, report };
  });

  const changeStatus = useCallback(
    async (
      reportId: string,
      status: WeeklyReportStatus,
      comment?: AddWeeklyReportCommentPayload,
    ) => {
      const updated = await updateReport(reportId, { status });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reports: prev.reports.map((r) => (r.id === reportId ? updated : r)),
        };
      });
      if (comment) {
        await addReportComment(reportId, comment);
      }
    },
    [],
  );

  return {
    weekStart,
    weekEnd,
    setWeekStart,
    goToPrevWeek,
    goToNextWeek,
    students,
    loading,
    error,
    reload: () => load(weekStart),
    changeStatus,
  };
}
