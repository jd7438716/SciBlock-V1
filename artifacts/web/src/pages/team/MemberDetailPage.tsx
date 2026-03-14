/**
 * MemberDetailPage — 学生详情页（/home/members/:id）
 *
 * Tabs: 个人信息 | 发表论文 | 毕业论文 | 实验记录 | 周报
 *
 * Layer: page
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import type { Student } from "../../types/team";
import { DEGREE_LABELS, STATUS_LABELS, STATUS_COLORS } from "../../types/team";
import { fetchMember } from "../../api/team";
import PersonalInfoTab   from "./detail/PersonalInfoTab";
import PapersTab         from "./detail/PapersTab";
import ThesisTab         from "./detail/ThesisTab";
import ExperimentRecordsTab from "./detail/ExperimentRecordsTab";
import WeeklyReportsTab  from "./detail/WeeklyReportsTab";

type Tab = "info" | "papers" | "thesis" | "records" | "reports";

const TABS: { id: Tab; label: string }[] = [
  { id: "info",    label: "个人信息"  },
  { id: "papers",  label: "发表论文"  },
  { id: "thesis",  label: "毕业论文"  },
  { id: "records", label: "实验记录"  },
  { id: "reports", label: "周报"      },
];

/** Generate initials avatar background color */
function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchMember(id)
      .then(r => setStudent(r.student))
      .catch(() => setError("无法加载成员信息"))
      .finally(() => setLoading(false));
  }, [id]);

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

  const sc = STATUS_COLORS[student.status] ?? STATUS_COLORS.active;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-8 py-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/home/members")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <span className="text-base">←</span>
          团队成员
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-900 font-medium">{student.name}</span>
      </div>

      {/* Profile header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 ${avatarColor(student.name)}`}>
              {student.name.charAt(0)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                {STATUS_LABELS[student.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
              <span>{DEGREE_LABELS[student.degree]}</span>
              <span className="text-gray-300">·</span>
              <span>{student.enrollmentYear} 级</span>
              {student.email && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{student.email}</span>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed max-w-xl">
              {student.researchTopic}
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-8 border-b border-gray-100 bg-white">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6 max-w-3xl">
        {tab === "info"    && (
          <PersonalInfoTab student={student} onUpdated={setStudent} />
        )}
        {tab === "papers"  && <PapersTab  studentId={student.id} />}
        {tab === "thesis"  && <ThesisTab  studentId={student.id} />}
        {tab === "records" && <ExperimentRecordsTab />}
        {tab === "reports" && <WeeklyReportsTab studentId={student.id} />}
      </div>
    </div>
  );
}
