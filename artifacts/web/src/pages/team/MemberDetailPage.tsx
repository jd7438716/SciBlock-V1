/**
 * MemberDetailPage — 学生详情页（/home/members/:id）
 *
 * 风格：模仿实验系统 OntologyModuleEditor 的 section 列表布局
 *
 * Layout:
 *   粘性面包屑栏
 *   Profile header（白色卡片）
 *   ─── 基本信息 ─────
 *   BasicInfoCard
 *   ─── 论文信息 ─────
 *   PapersCard
 *   ─── 实验记录 ─────
 *   ExperimentRecordsCard
 *   ─── 周报 ─────────
 *   WeeklyReportsCard
 *
 * Layer: page
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import type { Student } from "../../types/team";
import { DEGREE_LABELS } from "../../types/team";
import { fetchMember } from "../../api/team";
import BasicInfoCard        from "./detail/BasicInfoCard";
import PapersCard           from "./detail/PapersCard";
import ExperimentRecordsCard from "./detail/ExperimentRecordsCard";
import WeeklyReportsCard    from "./detail/WeeklyReportsCard";

// ---------------------------------------------------------------------------
// Avatar color (deterministic per name)
// ---------------------------------------------------------------------------

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

// ---------------------------------------------------------------------------
// SectionHeading — 与工作台 section 标题一致的分隔行
// ---------------------------------------------------------------------------

function SectionHeading({
  title, count, action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide select-none">
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-gray-100" />
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchMember(id)
      .then(r => setStudent(r.student))
      .catch(() => setError("无法加载成员信息"))
      .finally(() => setLoading(false));
  }, [id]);

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <p className="text-3xl">😕</p>
        <p className="text-sm">{error ?? "找不到该成员"}</p>
        <button onClick={() => navigate("/home/members")} className="text-sm text-black underline">
          返回成员列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/60">

      {/* ── 面包屑栏 ────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-2.5 flex items-center gap-2">
        <button
          onClick={() => navigate("/home/members")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black transition-colors"
        >
          <span className="text-sm leading-none">←</span>
          团队成员
        </button>
        <span className="text-gray-300 select-none text-xs">›</span>
        <span className="text-xs text-gray-900 font-medium">{student.name}</span>
      </div>

      {/* ── Profile header ──────────────────────────────────── */}
      <div className="px-6 pt-5 pb-0">
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm px-4 py-3 flex items-center gap-4">
          {/* Avatar */}
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${avatarColor(student.name)}`}
            >
              {student.name.charAt(0)}
            </div>
          )}

          {/* Name / meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{student.name}</span>
              {/* Degree tag */}
              <span className="text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none bg-gray-100 text-gray-500 border-gray-200">
                {DEGREE_LABELS[student.degree] ?? student.degree}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{student.researchTopic}</p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="px-6 py-5 max-w-3xl flex flex-col gap-5">

        {/* 基本信息 */}
        <section>
          <SectionHeading title="基本信息" />
          <BasicInfoCard student={student} onUpdated={setStudent} />
        </section>

        {/* 论文信息 */}
        <section>
          <SectionHeading
            title="论文信息"
          />
          <PapersCard studentId={student.id} />
        </section>

        {/* 实验记录 */}
        <section>
          <SectionHeading title="实验记录" />
          <ExperimentRecordsCard />
        </section>

        {/* 周报 */}
        <section>
          <SectionHeading title="周报" />
          <WeeklyReportsCard studentId={student.id} />
        </section>

      </div>
    </div>
  );
}
