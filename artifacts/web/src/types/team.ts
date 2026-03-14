/**
 * team — 团队成员相关类型定义
 *
 * Layer: types (pure data contracts)
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type StudentDegree = "bachelor" | "master" | "phd";
export type StudentStatus = "active" | "pending" | "graduated";

export const DEGREE_LABELS: Record<StudentDegree, string> = {
  bachelor: "本科",
  master:   "硕士",
  phd:      "博士",
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active:    "在读",
  pending:   "待确认",
  graduated: "已毕业",
};

export const STATUS_COLORS: Record<StudentStatus, { bg: string; text: string }> = {
  active:    { bg: "bg-green-100",  text: "text-green-700"  },
  pending:   { bg: "bg-yellow-100", text: "text-yellow-700" },
  graduated: { bg: "bg-gray-100",   text: "text-gray-600"   },
};

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export interface Student {
  id: string;
  name: string;
  avatar: string | null;
  enrollmentYear: number;
  degree: StudentDegree;
  researchTopic: string;
  phone: string | null;
  email: string | null;
  status: StudentStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Paper
// ---------------------------------------------------------------------------

export interface Paper {
  id: string;
  studentId: string;
  title: string;
  journal: string | null;
  year: number | null;
  abstract: string | null;
  doi: string | null;
  fileName: string | null;
  isThesis: boolean;
  uploadedAt: string;
}

// ---------------------------------------------------------------------------
// WeeklyReport
// ---------------------------------------------------------------------------

export interface WeeklyReport {
  id: string;
  studentId: string;
  title: string;
  content: string;
  weekStart: string;
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// API request shapes
// ---------------------------------------------------------------------------

export interface InviteStudentRequest {
  name: string;
  email: string;
  phone?: string;
  enrollmentYear: number;
  degree: StudentDegree;
  researchTopic: string;
}

export interface UpdateStudentRequest {
  name?: string;
  phone?: string;
  email?: string;
  enrollmentYear?: number;
  degree?: StudentDegree;
  researchTopic?: string;
}

export interface AddPaperRequest {
  title: string;
  journal?: string;
  year?: number;
  abstract?: string;
  doi?: string;
  fileName?: string;
  isThesis: boolean;
}

export interface AddWeeklyReportRequest {
  title: string;
  content: string;
  weekStart: string;
}
