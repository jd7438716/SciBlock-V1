/**
 * useStudentReports — 导师在成员详情页查看某学生全部周报的数据 hook。
 *
 * 职责：
 *  - 调用 GET /api/reports?studentId=:id（Express reports 路由，导师权限）
 *  - 过滤掉草稿（学生尚未提交=未分享给导师）
 *  - 返回按 weekStart 降序排列的报告列表
 *
 * 设计原则：
 *  - 仅供导师使用；学生自己提交周报使用 hooks/team/useWeeklyReports.ts
 *  - 无副作用，无写操作 — 所有写操作（评论、批阅）发生在各自专用组件中
 *  - 类型完全基于 types/weeklyReport.ts（含 status、reviewedAt、aiContentJson 等）
 *
 * Layer: hooks
 */

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/api/client";
import type { WeeklyReport } from "@/types/weeklyReport";

export interface UseStudentReportsResult {
  reports: WeeklyReport[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches all submitted (non-draft) weekly reports for a given student.
 *
 * @param studentId  The student's profile ID (not the auth user ID).
 *                   Pass an empty string or null to skip the request.
 */
export function useStudentReports(
  studentId: string | null,
): UseStudentReportsResult {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await apiFetch<WeeklyReport[]>(
        `/reports?studentId=${encodeURIComponent(id)}`,
      );
      // Exclude drafts — instructors must not see content students haven't shared
      const submitted = all.filter((r) => r.status !== "draft");
      // Sort descending by weekStart (API already orders by weekStart DESC, but enforce locally too)
      submitted.sort(
        (a, b) =>
          new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
      );
      setReports(submitted);
    } catch {
      setError("加载周报失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!studentId) {
      setReports([]);
      return;
    }
    void load(studentId);
  }, [studentId, load]);

  return { reports, loading, error };
}
