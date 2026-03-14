/**
 * team — 前端数据访问层
 *
 * Layer: api (thin fetch wrappers, callers never import fetch directly)
 */

import { apiFetch } from "./client";
import type {
  Student,
  Paper,
  WeeklyReport,
  InviteStudentRequest,
  UpdateStudentRequest,
  AddPaperRequest,
  AddWeeklyReportRequest,
} from "../types/team";

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export function fetchMembers(): Promise<{ members: Student[] }> {
  return apiFetch<{ members: Student[] }>("/team/members");
}

export function fetchMember(id: string): Promise<{ student: Student }> {
  return apiFetch<{ student: Student }>(`/team/members/${id}`);
}

export function inviteStudent(data: InviteStudentRequest): Promise<{ student: Student }> {
  return apiFetch<{ student: Student }>("/team/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStudent(
  id: string,
  data: UpdateStudentRequest,
): Promise<{ student: Student }> {
  return apiFetch<{ student: Student }>(`/team/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateStudentStatus(
  id: string,
  status: import("../types/team").StudentStatus,
): Promise<{ student: Student }> {
  return apiFetch<{ student: Student }>(`/team/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

export function fetchPapers(studentId: string): Promise<{ papers: Paper[] }> {
  return apiFetch<{ papers: Paper[] }>(`/team/members/${studentId}/papers`);
}

export function addPaper(
  studentId: string,
  data: AddPaperRequest,
): Promise<{ paper: Paper }> {
  return apiFetch<{ paper: Paper }>(`/team/members/${studentId}/papers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePaper(
  studentId: string,
  paperId: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/team/members/${studentId}/papers/${paperId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Weekly reports
// ---------------------------------------------------------------------------

export function fetchReports(studentId: string): Promise<{ reports: WeeklyReport[] }> {
  return apiFetch<{ reports: WeeklyReport[] }>(`/team/members/${studentId}/reports`);
}

export function addReport(
  studentId: string,
  data: AddWeeklyReportRequest,
): Promise<{ report: WeeklyReport }> {
  return apiFetch<{ report: WeeklyReport }>(`/team/members/${studentId}/reports`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
