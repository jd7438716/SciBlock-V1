/**
 * team — 团队成员相关类型定义
 *
 * Layer: types (pure data contracts)
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type StudentDegree = "bachelor" | "master" | "phd" | "joint";
export type StudentStatus = "active" | "pending" | "graduated";

export const DEGREE_LABELS: Record<StudentDegree, string> = {
  bachelor: "本科",
  master:   "硕士",
  phd:      "博士",
  joint:    "联培",
};

export const DEGREE_OPTIONS: { value: StudentDegree; label: string }[] = [
  { value: "master",   label: "硕士" },
  { value: "phd",      label: "博士" },
  { value: "joint",    label: "联培" },
  { value: "bachelor", label: "本科" },
];

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active:    "在读",
  pending:   "待确认",
  graduated: "已毕业",
};

export const STATUS_COLORS: Record<StudentStatus, { bg: string; text: string; ring: string }> = {
  active:    { bg: "bg-green-100",  text: "text-green-800",  ring: "ring-green-200"  },
  pending:   { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-200" },
  graduated: { bg: "bg-blue-100",   text: "text-blue-800",   ring: "ring-blue-200"   },
};

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export interface Student {
  id: string;
  /** Auth user ID (users.id / scinotes.user_id).
   *  Null when the student has been added but has not accepted their invite yet
   *  (no user account exists).  Use this — NOT `id` — when calling Go API
   *  instructor endpoints that query scinotes / experiment_records. */
  userId: string | null;
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
// WeeklyReport — canonical definition lives in types/weeklyReport.ts
// Re-exported here for backward-compat; prefer importing from weeklyReport.ts
// ---------------------------------------------------------------------------

export type { WeeklyReport } from "./weeklyReport";

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
  status?: StudentStatus;
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
