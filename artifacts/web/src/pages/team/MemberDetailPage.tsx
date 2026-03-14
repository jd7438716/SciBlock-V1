/**
 * MemberDetailPage — 学生详情页（/home/members/:id）
 *
 * Layout: 纵向卡片堆叠
 *   ① 基本信息卡片（内联点击编辑）
 *   ② 论文信息卡片（发表论文 + 毕业论文）
 *   ③ 实验记录卡片
 *   ④ 周报卡片
 *
 * Layer: page
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import type { Student } from "../../types/team";
import { STATUS_LABELS, STATUS_COLORS } from "../../types/team";
import { fetchMember } from "../../api/team";
import BasicInfoCard        from "./detail/BasicInfoCard";
import PapersCard           from "./detail/PapersCard";
import ExperimentRecordsCard from "./detail/ExperimentRecordsCard";
import WeeklyReportsCard    from "./detail/WeeklyReportsCard";

// ---------------------------------------------------------------------------
// Avatar color helper (deterministic per name)
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
  // Loading / error states
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
        <button
          onClick={() => navigate("/home/members")}
          className="text-sm text-black underline"
        >
          返回成员列表
        </button>
      </div>
    );
  }

  const sc = STATUS_COLORS[student.status] ?? STATUS_COLORS.active;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">

      {/* ── Breadcrumb bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-8 py-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/home/members")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <span className="text-base leading-none">←</span>
          团队成员
        </button>
        <span className="text-gray-300 select-none">›</span>
        <span className="text-sm text-gray-900 font-medium">{student.name}</span>
      </div>

      {/* ── Profile header card ────────────────────────────────── */}
      <div className="px-8 pt-6 pb-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-center gap-5">
          {/* Avatar */}
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${avatarColor(student.name)}`}
            >
              {student.name.charAt(0)}
            </div>
          )}

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}
              >
                {STATUS_LABELS[student.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {student.researchTopic}
            </p>
          </div>
        </div>
      </div>

      {/* ── Card stack ────────────────────────────────────────── */}
      <div className="px-8 py-6 space-y-4 max-w-4xl">

        {/* ① 基本信息 */}
        <BasicInfoCard student={student} onUpdated={setStudent} />

        {/* ② 论文信息 */}
        <PapersCard studentId={student.id} />

        {/* ③ 实验记录 */}
        <ExperimentRecordsCard />

        {/* ④ 周报 */}
        <WeeklyReportsCard studentId={student.id} />

      </div>
    </div>
  );
}
