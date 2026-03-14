/**
 * useStudentDetail — 学生详情页业务逻辑 hook
 *
 * 职责：
 *   - 加载单个成员数据
 *   - 封装字段更新（单字段 + 全量表单保存）
 *
 * Layer: business logic (hooks)
 */

import { useState, useEffect } from "react";
import type { Student, UpdateStudentRequest } from "../../types/team";
import { fetchMember, updateStudent } from "../../api/team";

export interface UseStudentDetailResult {
  student:     Student | null;
  loading:     boolean;
  error:       string | null;
  setStudent:  (s: Student) => void;
  updateField: (patch: UpdateStudentRequest) => Promise<Student>;
}

export function useStudentDetail(id: string): UseStudentDetailResult {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchMember(id)
      .then(r => setStudent(r.student))
      .catch(() => setError("无法加载成员信息"))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateField(patch: UpdateStudentRequest): Promise<Student> {
    const { student: updated } = await updateStudent(id, patch);
    setStudent(updated);
    return updated;
  }

  return { student, loading, error, setStudent, updateField };
}
