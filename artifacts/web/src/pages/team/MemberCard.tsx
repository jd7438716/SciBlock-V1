/**
 * MemberCard — 学生信息卡片（网格项）
 *
 * 展示：头像 / 姓名 / 学位·年级 / 研究课题 / 邮箱 / 状态标签
 * 交互：点击卡片跳转详情；点击状态标签弹出选择框（不触发跳转）
 *
 * Layer: component
 */

import type { Student, StudentStatus } from "../../types/team";
import { DEGREE_LABELS } from "../../types/team";
import { updateStudentStatus } from "../../api/team";
import { StudentStatusTag } from "../../components/team/StudentStatusTag";

interface Props {
  student:        Student;
  onClick:        () => void;
  onStatusChange: (updated: Student) => void;
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500",  "bg-cyan-500",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export default function MemberCard({ student, onClick, onStatusChange }: Props) {
  async function handleStatusSave(next: StudentStatus) {
    const { student: updated } = await updateStudentStatus(student.id, next);
    onStatusChange(updated);
  }

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                 transition-all duration-150 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      {/* Avatar + status */}
      <div className="flex items-start justify-between mb-4">
        {/* Avatar */}
        <div className="relative">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold ${avatarColor(student.name)}`}>
              {student.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Interactive status tag */}
        <StudentStatusTag
          status={student.status}
          onSave={handleStatusSave}
          stopPropagation
        />
      </div>

      {/* Name + degree */}
      <div className="mb-1">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-black">
          {student.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {DEGREE_LABELS[student.degree]} · {student.enrollmentYear} 级
        </p>
      </div>

      {/* Research topic */}
      <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-snug">
        {student.researchTopic}
      </p>

      {/* Email */}
      {student.email && (
        <p className="mt-3 text-xs text-gray-400 truncate">{student.email}</p>
      )}
    </button>
  );
}
