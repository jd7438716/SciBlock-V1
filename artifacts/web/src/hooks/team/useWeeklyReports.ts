/**
 * useWeeklyReports — 周报列表 CRUD hook
 *
 * 职责：
 *   - 加载学生周报列表
 *   - 封装提交新周报
 *   - 通知外部计数变化（onCountChange）
 *
 * Layer: business logic (hooks)
 */

import { useState, useEffect, useCallback } from "react";
import type { WeeklyReport, AddWeeklyReportRequest } from "../../types/team";
import {
  fetchReports as apiFetchReports,
  addReport    as apiAddReport,
} from "../../api/team";

export interface UseWeeklyReportsResult {
  reports:      WeeklyReport[];
  loading:      boolean;
  submitReport: (data: AddWeeklyReportRequest) => Promise<WeeklyReport>;
}

export function useWeeklyReports(
  studentId: string,
  onCountChange?: (count: number) => void,
): UseWeeklyReportsResult {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const sync = useCallback((next: WeeklyReport[]) => {
    setReports(next);
    onCountChange?.(next.length);
  }, [onCountChange]);

  useEffect(() => {
    setLoading(true);
    apiFetchReports(studentId)
      .then(r => sync(r.reports))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, sync]);

  async function submitReport(data: AddWeeklyReportRequest): Promise<WeeklyReport> {
    const { report } = await apiAddReport(studentId, data);
    sync([report, ...reports]);
    return report;
  }

  return { reports, loading, submitReport };
}
