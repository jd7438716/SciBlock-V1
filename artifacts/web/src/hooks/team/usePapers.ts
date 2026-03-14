/**
 * usePapers — 论文列表 CRUD hook
 *
 * 职责：
 *   - 加载学生论文列表
 *   - 封装新增 / 删除 / 替换（编辑 = 删旧 + 新增）
 *   - 通知外部计数变化（onCountChange）
 *
 * Layer: business logic (hooks)
 */

import { useState, useEffect, useCallback } from "react";
import type { Paper, AddPaperRequest } from "../../types/team";
import {
  fetchPapers  as apiFetchPapers,
  addPaper     as apiAddPaper,
  deletePaper  as apiDeletePaper,
} from "../../api/team";

export interface UsePapersResult {
  papers:        Paper[];
  loading:       boolean;
  addNewPaper:   (data: AddPaperRequest) => Promise<Paper>;
  removePaper:   (paperId: string) => Promise<void>;
  replacePaper:  (oldId: string, data: AddPaperRequest) => Promise<Paper>;
}

export function usePapers(
  studentId: string,
  onCountChange?: (count: number) => void,
): UsePapersResult {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const sync = useCallback((next: Paper[]) => {
    setPapers(next);
    onCountChange?.(next.length);
  }, [onCountChange]);

  useEffect(() => {
    setLoading(true);
    apiFetchPapers(studentId)
      .then(r => sync(r.papers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, sync]);

  async function addNewPaper(data: AddPaperRequest): Promise<Paper> {
    const { paper } = await apiAddPaper(studentId, data);
    sync([paper, ...papers]);
    return paper;
  }

  async function removePaper(paperId: string): Promise<void> {
    await apiDeletePaper(studentId, paperId);
    sync(papers.filter(p => p.id !== paperId));
  }

  async function replacePaper(oldId: string, data: AddPaperRequest): Promise<Paper> {
    await apiDeletePaper(studentId, oldId);
    const { paper } = await apiAddPaper(studentId, data);
    sync([paper, ...papers.filter(p => p.id !== oldId)]);
    return paper;
  }

  return { papers, loading, addNewPaper, removePaper, replacePaper };
}
