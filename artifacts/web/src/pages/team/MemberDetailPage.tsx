/**
 * MemberDetailPage — 学生详情页（/home/members/:id）
 *
 * 权限说明：
 * - 所有已登录用户可以查看任何学生的信息（团队透明）
 * - 导师(instructor)可以编辑所有学生的信息
 * - 学生本人也可以编辑自己的信息
 * - 具体权限规则在 @/lib/permissions/policies.ts 中集中管理
 *
 * Layer: page
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  BookOpen, FileText, FlaskConical, ScrollText,
  GraduationCap,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useStudentDetail }  from "@/hooks/team/useStudentDetail";
import { useSciNoteStore }   from "@/contexts/SciNoteStoreContext";
import { useStudentPermissions } from "@/lib/permissions/usePermissions";
import { ProfileCard }       from "./detail/ProfileCard";
import { SectionHeading }    from "@/components/team/SectionHeading";
import BasicInfoCard         from "./detail/BasicInfoCard";
import PapersCard            from "./detail/PapersCard";
import ExperimentRecordsCard from "./detail/ExperimentRecordsCard";
import WeeklyReportsCard     from "./detail/WeeklyReportsCard";

export default function MemberDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { notes }    = useSciNoteStore();

  const { student, loading, error, setStudent } = useStudentDetail(id ?? "");

  const [paperCount,  setPaperCount]  = useState(0);
  const [reportCount, setReportCount] = useState(0);

  // 使用集中式权限系统获取所有权限
  const perms = useStudentPermissions(student?.userId ?? null);

  if (loading) {
    return (
      <AppLayout title="成员详情">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-xs text-gray-400">加载中…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !student) {
    return (
      <AppLayout title="成员详情">
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
      </AppLayout>
    );
  }

  const breadcrumb = [
    { label: "团队成员", onClick: () => navigate("/home/members") },
    { label: student.name },
  ];

  return (
    <AppLayout title={student.name} breadcrumb={breadcrumb}>
      <div className="-mx-8 -my-8 flex-1 overflow-y-auto bg-gray-50/70">
      <div className="px-6 py-5 max-w-2xl mx-auto w-full flex flex-col gap-6">

        <ProfileCard
          student={student}
          paperCount={paperCount}
          reportCount={reportCount}
          noteCount={notes.length}
          onStudentChange={setStudent}
          canEditStatus={perms.canEditStatus}
        />

        <section>
          <SectionHeading icon={<FileText size={12} />} title="基本信息" />
          <BasicInfoCard 
            student={student} 
            onUpdated={setStudent} 
            canEdit={perms.canEditProfile} 
          />
        </section>

        <section>
          <SectionHeading icon={<BookOpen size={12} />} title="论文信息" count={paperCount} />
          <PapersCard 
            studentId={student.id} 
            onCountChange={setPaperCount} 
            canAdd={perms.canAddPaper}
            canEdit={perms.canEditPaper}
            canDelete={perms.canDeletePaper}
          />
        </section>

        <section>
          <SectionHeading icon={<FlaskConical size={12} />} title="实验记录" count={notes.length} />
          <ExperimentRecordsCard />
        </section>

        <section>
          <SectionHeading icon={<ScrollText size={12} />} title="周报" count={reportCount} />
          <WeeklyReportsCard 
            studentId={student.id} 
            onCountChange={setReportCount}
            canAdd={perms.canAddReport}
          />
        </section>

      </div>
      </div>
    </AppLayout>
  );
}
