/**
 * MemberDetailPage — 学生详情页（/home/members/:id）
 *
 * Layout:
 *   粘性面包屑栏
 *   Profile hero card（渐变顶条 + 头像 + 统计栏）
 *   Section × 4（基本信息 / 论文信息 / 实验记录 / 周报）
 *
 * Layer: page
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  BookOpen, FileText, FlaskConical, ScrollText,
  Mail, Phone, GraduationCap, ChevronLeft,
} from "lucide-react";
import type { Student } from "../../types/team";
import { DEGREE_LABELS } from "../../types/team";
import { fetchMember } from "../../api/team";
import { fetchPapers } from "../../api/team";
import { fetchReports } from "../../api/team";
import { useSciNoteStore } from "../../contexts/SciNoteStoreContext";
import BasicInfoCard         from "./detail/BasicInfoCard";
import PapersCard            from "./detail/PapersCard";
import ExperimentRecordsCard from "./detail/ExperimentRecordsCard";
import WeeklyReportsCard     from "./detail/WeeklyReportsCard";

// ---------------------------------------------------------------------------
// Avatar color + gradient helpers
// ---------------------------------------------------------------------------

const PALETTES = [
  { avatar: "bg-blue-500",    grad: "from-blue-400 to-blue-600"     },
  { avatar: "bg-violet-500",  grad: "from-violet-400 to-violet-600" },
  { avatar: "bg-emerald-500", grad: "from-emerald-400 to-emerald-600" },
  { avatar: "bg-amber-500",   grad: "from-amber-400 to-amber-600"   },
  { avatar: "bg-rose-500",    grad: "from-rose-400 to-rose-600"     },
  { avatar: "bg-cyan-500",    grad: "from-cyan-400 to-cyan-600"     },
];

function palette(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return PALETTES[hash % PALETTES.length];
}

// ---------------------------------------------------------------------------
// SectionHeading
// ---------------------------------------------------------------------------

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
}

function SectionHeading({ icon, title, count }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs font-semibold text-gray-600 tracking-wide">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatBadge — bottom stats row in profile card
// ---------------------------------------------------------------------------

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileCard
// ---------------------------------------------------------------------------

function ProfileCard({ student, paperCount, reportCount, noteCount }: {
  student: Student;
  paperCount: number;
  reportCount: number;
  noteCount: number;
}) {
  const pal = palette(student.name);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Colored top accent gradient strip */}
      <div className={`h-1.5 bg-gradient-to-r ${pal.grad}`} />

      {/* Main content */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm ring-2 ring-white"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm ${pal.avatar}`}
            >
              {student.name.charAt(0)}
            </div>
          )}

          {/* Name / meta */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900 leading-none">
                {student.name}
              </h1>
              <span className="text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none bg-gray-100 text-gray-500 border-gray-200">
                {DEGREE_LABELS[student.degree] ?? student.degree}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {student.enrollmentYear} 级
              </span>
            </div>

            {/* Research topic */}
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
              {student.researchTopic}
            </p>

            {/* Contact info */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {student.email && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <Mail size={10} className="flex-shrink-0" />
                  {student.email}
                </span>
              )}
              {student.phone && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <Phone size={10} className="flex-shrink-0" />
                  {student.phone}
                </span>
              )}
              {!student.email && !student.phone && (
                <span className="text-[11px] text-gray-300 italic">暂无联系方式</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-4 mx-5 mb-4 border-t border-gray-100 pt-3 flex items-center justify-around">
        <StatBadge value={paperCount}  label="篇论文" />
        <div className="w-px h-6 bg-gray-100" />
        <StatBadge value={reportCount} label="份周报" />
        <div className="w-px h-6 bg-gray-100" />
        <StatBadge value={noteCount}   label="条记录" />
      </div>
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
  const [paperCount, setPaperCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const { notes } = useSciNoteStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchMember(id),
      fetchPapers(id),
      fetchReports(id),
    ])
      .then(([memberRes, papersRes, reportsRes]) => {
        setStudent(memberRes.student);
        setPaperCount(papersRes.papers.length);
        setReportCount(reportsRes.reports.length);
      })
      .catch(() => setError("无法加载成员信息"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">加载中…</span>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <GraduationCap size={32} className="text-gray-200" />
        <p className="text-sm">{error ?? "找不到该成员"}</p>
        <button
          onClick={() => navigate("/home/members")}
          className="text-xs text-black font-medium underline underline-offset-2"
        >
          返回成员列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/70">

      {/* ── 面包屑栏 ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-2.5">
        <button
          onClick={() => navigate("/home/members")}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ChevronLeft
            size={13}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          <span>团队成员</span>
          <span className="text-gray-300 mx-0.5">·</span>
          <span className="text-gray-900 font-medium">{student.name}</span>
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="px-6 py-5 max-w-2xl flex flex-col gap-6">

        {/* Profile hero */}
        <ProfileCard
          student={student}
          paperCount={paperCount}
          reportCount={reportCount}
          noteCount={notes.length}
        />

        {/* 基本信息 */}
        <section>
          <SectionHeading icon={<FileText size={12} />} title="基本信息" />
          <BasicInfoCard student={student} onUpdated={s => {
            setStudent(s);
          }} />
        </section>

        {/* 论文信息 */}
        <section>
          <SectionHeading icon={<BookOpen size={12} />} title="论文信息" count={paperCount} />
          <PapersCard studentId={student.id} onCountChange={setPaperCount} />
        </section>

        {/* 实验记录 */}
        <section>
          <SectionHeading icon={<FlaskConical size={12} />} title="实验记录" count={notes.length} />
          <ExperimentRecordsCard />
        </section>

        {/* 周报 */}
        <section>
          <SectionHeading icon={<ScrollText size={12} />} title="周报" count={reportCount} />
          <WeeklyReportsCard studentId={student.id} onCountChange={setReportCount} />
        </section>

      </div>
    </div>
  );
}
