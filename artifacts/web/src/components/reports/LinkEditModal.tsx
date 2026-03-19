/**
 * LinkEditModal — modal for selecting which experiment records to link to a
 * weekly report.
 *
 * Layer: business component (fetches candidates, saves links)
 *
 * Supports both data models:
 *   isNewDateModel = true  → fetches candidates via fetchCandidateExperiments
 *   isNewDateModel = false → fetches candidates via fetchReportPreview (legacy)
 */

import React, { useState, useEffect } from "react";
import { X, FlaskConical, Loader2, Square, CheckSquare } from "lucide-react";
import type { LinkedExperiment, ReportPreviewExperiment, CandidateExperiment } from "@/types/weeklyReport";
import { EXP_STATUS_COLORS } from "@/types/weeklyReport";
import {
  fetchReportDates,
  fetchCandidateExperiments,
  fetchReportPreview,
  saveReportLinks,
  fetchReportLinks,
} from "@/api/weeklyReport";

interface LinkEditModalProps {
  reportId: string;
  isNewDateModel: boolean;
  dateStart: string | null;
  dateEnd: string | null;
  currentLinked: LinkedExperiment[];
  onSaved: (updated: LinkedExperiment[]) => void;
  onClose: () => void;
}

export function LinkEditModal({
  reportId,
  isNewDateModel,
  dateStart,
  dateEnd,
  currentLinked,
  onSaved,
  onClose,
}: LinkEditModalProps) {
  const [candidates,   setCandidates]   = useState<(ReportPreviewExperiment | CandidateExperiment)[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set(currentLinked.map((e) => e.id)));
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      if (isNewDateModel) {
        const datesRes = await fetchReportDates(reportId);
        if (datesRes.dates.length === 0) { setCandidates([]); setLoading(false); return; }
        const candRes = await fetchCandidateExperiments(datesRes.dates);
        if (!cancelled) {
          setCandidates(candRes.groups.flatMap((g) => g.experiments));
          setLoading(false);
        }
      } else {
        if (!dateStart || !dateEnd) { setLoading(false); return; }
        const res = await fetchReportPreview(dateStart, dateEnd);
        if (!cancelled) { setCandidates(res.experiments); setLoading(false); }
      }
    };

    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId, isNewDateModel, dateStart, dateEnd]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      selectedIds.size === candidates.length
        ? new Set()
        : new Set(candidates.map((e) => e.id)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const ids = [...selectedIds];
      await saveReportLinks(reportId, ids);
      const res = await fetchReportLinks(reportId);
      onSaved(res.experiments);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
    }
  }

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">管理关联实验记录</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">检索候选实验…</span>
            </div>
          ) : (!isNewDateModel && (!dateStart || !dateEnd)) ? (
            <div className="px-5 py-6 text-center text-sm text-gray-500">
              该周报未设置时间范围，无法检索候选实验。
            </div>
          ) : candidates.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <FlaskConical size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {isNewDateModel ? "已选日期内没有实验记录" : "时间范围内没有实验记录"}
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0"
                onClick={toggleAll}
              >
                {allSelected
                  ? <CheckSquare size={15} className="text-violet-600 shrink-0" />
                  : <Square size={15} className="text-gray-400 shrink-0" />}
                <span className="text-xs font-medium text-gray-600">
                  {allSelected ? "取消全选" : "全选"}
                  &ensp;·&ensp;共 {candidates.length} 条候选实验
                </span>
                {selectedIds.size > 0 && (
                  <span className="ml-auto text-xs font-medium text-violet-600">
                    已选 {selectedIds.size} 条
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {candidates.map((e) => {
                  const checked = selectedIds.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
                        checked ? "bg-violet-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggle(e.id)}
                    >
                      {checked
                        ? <CheckSquare size={15} className="text-violet-600 shrink-0" />
                        : <Square size={15} className="text-gray-300 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{e.title}</p>
                        <p className="text-xs text-gray-400 truncate">{e.sciNoteTitle}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                        EXP_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"
                      }`}>
                        {e.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-white">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <p className="text-xs text-gray-400">选择后点击保存，将替换当前所有关联</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中…" : "保存关联"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
