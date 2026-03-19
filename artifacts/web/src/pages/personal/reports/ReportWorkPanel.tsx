/**
 * ReportWorkPanel — 历史手动周报查看 / 有限编辑面板
 *
 * 职责：
 *   - 主要用于查看已存在的手动周报（generationStatus = idle/null）
 *   - draft / needs_revision 状态下提供编辑和提交功能；其余状态只读
 *   - report = null 时渲染空状态占位，提示用户从左侧选择周报
 *
 * 注意：
 *   新建周报的唯一入口是 GenerateReportWizard（自动汇总向导），
 *   本组件不承担任何新建逻辑。
 */
import React, { useState, useEffect } from "react";
import { FlaskConical, Pencil, Loader2, Square, CheckSquare, Link2, X } from "lucide-react";
import { ReportStatusTag } from "@/components/reports/ReportStatusTag";
import { ReportContentForm } from "@/components/reports/ReportContentForm";
import { ReportContentView } from "@/components/reports/ReportContentView";
import { CommentThread } from "@/components/reports/CommentThread";
import type { WeeklyReport, WeeklyReportContent, LinkedExperiment } from "@/types/weeklyReport";
import {
  EMPTY_REPORT_CONTENT, parseReportContent, fmtWeekRange, fmtWeekLabel,
  EXP_STATUS_COLORS,
} from "@/types/weeklyReport";
import { fetchReportLinks, saveReportLinks, fetchReportPreview } from "@/api/weeklyReport";
import type { ReportPreviewExperiment } from "@/types/weeklyReport";

interface Props {
  report: WeeklyReport | null;
  studentId: string;
  studentName: string;
  userId: string;
  onSave: (id: string, content: WeeklyReportContent, title?: string) => Promise<WeeklyReport>;
  onSubmit: (id: string, content: WeeklyReportContent, title?: string) => Promise<WeeklyReport>;
  onDelete: (id: string) => Promise<void>;
  onReportUpdated: (updated: WeeklyReport) => void;
}

// ---------------------------------------------------------------------------
// LinkedExperimentsSection — shows linked records + edit modal when editable
// ---------------------------------------------------------------------------

interface LinkedSectionProps {
  reportId: string;
  reportDateStart: string | null;
  reportDateEnd: string | null;
  isEditable: boolean;
}

function LinkedExperimentsSection({ reportId, reportDateStart, reportDateEnd, isEditable }: LinkedSectionProps) {
  const [linked, setLinked] = useState<LinkedExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReportLinks(reportId)
      .then((res) => { if (!cancelled) { setLinked(res.experiments); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId]);

  const handleSaved = (updated: LinkedExperiment[]) => {
    setLinked(updated);
    setModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-800">关联实验记录</h3>
          {!loading && (
            <span className="text-xs text-gray-400">{linked.length > 0 ? `${linked.length} 条` : "未关联"}</span>
          )}
        </div>
        {isEditable && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
          >
            <Pencil size={12} />
            管理关联
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
          <Loader2 size={12} className="animate-spin" />
          加载中…
        </div>
      ) : linked.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">
          {isEditable ? "点击「管理关联」选择要关联的实验记录" : "暂无关联实验记录"}
        </p>
      ) : (
        <div className="divide-y divide-gray-50 -mx-1">
          {linked.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-1 py-2">
              <FlaskConical size={13} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{e.title}</p>
                <p className="text-xs text-gray-400 truncate">{e.sciNoteTitle}</p>
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                  EXP_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <LinkEditModal
          reportId={reportId}
          dateStart={reportDateStart}
          dateEnd={reportDateEnd}
          currentLinked={linked}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LinkEditModal — select candidates from date range, save links
// ---------------------------------------------------------------------------

interface LinkEditModalProps {
  reportId: string;
  dateStart: string | null;
  dateEnd: string | null;
  currentLinked: LinkedExperiment[];
  onSaved: (updated: LinkedExperiment[]) => void;
  onClose: () => void;
}

function LinkEditModal({ reportId, dateStart, dateEnd, currentLinked, onSaved, onClose }: LinkEditModalProps) {
  const [candidates, setCandidates] = useState<ReportPreviewExperiment[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentLinked.map((e) => e.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateStart || !dateEnd) {
      setLoadingCandidates(false);
      return;
    }
    fetchReportPreview(dateStart, dateEnd)
      .then((res) => { setCandidates(res.experiments); setLoadingCandidates(false); })
      .catch(() => { setLoadingCandidates(false); });
  }, [dateStart, dateEnd]);

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
      const res = await import("@/api/weeklyReport").then((m) => m.fetchReportLinks(reportId));
      onSaved(res.experiments);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
    }
  }

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: "80vh" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">管理关联实验记录</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loadingCandidates ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">检索候选实验…</span>
            </div>
          ) : !dateStart || !dateEnd ? (
            <div className="px-5 py-6 text-center text-sm text-gray-500">
              该周报未设置时间范围，无法检索候选实验。
            </div>
          ) : candidates.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <FlaskConical size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">时间范围内没有实验记录</p>
            </div>
          ) : (
            <>
              {/* Select all row */}
              <div
                className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0"
                onClick={toggleAll}
              >
                {allSelected ? (
                  <CheckSquare size={15} className="text-violet-600 shrink-0" />
                ) : (
                  <Square size={15} className="text-gray-400 shrink-0" />
                )}
                <span className="text-xs font-medium text-gray-600">
                  {allSelected ? "取消全选" : "全选"}
                  &ensp;·&ensp;共 {candidates.length} 条候选实验
                </span>
                {selectedIds.size > 0 && (
                  <span className="ml-auto text-xs font-medium text-violet-600">已选 {selectedIds.size} 条</span>
                )}
              </div>

              {/* Experiment rows */}
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
                      {checked ? (
                        <CheckSquare size={15} className="text-violet-600 shrink-0" />
                      ) : (
                        <Square size={15} className="text-gray-300 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{e.title}</p>
                        <p className="text-xs text-gray-400 truncate">{e.sciNoteTitle}</p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                          EXP_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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

// ---------------------------------------------------------------------------
// ReportWorkPanel (main)
// ---------------------------------------------------------------------------

export function ReportWorkPanel({
  report,
  studentId,
  studentName,
  userId,
  onSave,
  onSubmit,
  onDelete,
  onReportUpdated,
}: Props) {
  const [content, setContent] = useState<WeeklyReportContent>(EMPTY_REPORT_CONTENT);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (report) {
      setContent(parseReportContent(report));
      setTitle(report.title);
      setMessage(null);
    }
  }, [report?.id]);

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
        <p className="text-sm">从左侧选择一份周报</p>
      </div>
    );
  }

  const isEditable = report.status === "draft" || report.status === "needs_revision";

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await onSave(report.id, content, title);
      onReportUpdated(updated);
      setMessage("已保存草稿");
    } catch {
      setMessage("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.completed.trim() || !content.progress.trim() || !content.nextWeekPlan.trim()) {
      setMessage("请至少填写「本周完成内容」「当前实验进展」「下周计划」");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await onSubmit(report.id, content, title);
      onReportUpdated(updated);
      setMessage("提交成功！");
    } catch {
      setMessage("提交失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确认删除「${report.title}」？此操作不可撤销。`)) return;
    await onDelete(report.id);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-4">
            {isEditable ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 focus:outline-none focus:border-blue-500 w-full pb-1 transition-colors"
                placeholder="周报标题…"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {fmtWeekRange(report.weekStart, report.weekEnd)}
            </p>
          </div>
          <ReportStatusTag status={report.status} size="md" />
        </div>

        {/* Needs-revision notice */}
        {report.status === "needs_revision" && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700 font-medium">导师要求修改，请根据评论修改后重新提交。</p>
          </div>
        )}

        {/* Linked experiments */}
        <LinkedExperimentsSection
          reportId={report.id}
          reportDateStart={report.dateRangeStart ?? report.weekStart}
          reportDateEnd={report.dateRangeEnd ?? report.weekEnd}
          isEditable={isEditable}
        />

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-5">
          {isEditable ? (
            <ReportContentForm value={content} onChange={setContent} />
          ) : (
            <ReportContentView content={parseReportContent(report)} />
          )}
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                保存草稿
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                提交周报
              </button>
              <button
                onClick={handleDelete}
                className="ml-auto px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            </div>
            {/* Week context — prevents student from inadvertently submitting wrong week */}
            <p className="text-xs text-gray-400 mt-1.5">
              将提交：<span className="font-medium text-gray-600">{fmtWeekLabel(report.weekStart)}</span>
              （{fmtWeekRange(report.weekStart, report.weekEnd)}）周报
            </p>
            {message && (
              <p className={`text-sm mt-1.5 ${message.includes("失败") ? "text-red-500" : "text-gray-500"}`}>
                {message}
              </p>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <CommentThread
            reportId={report.id}
            author={{ id: userId, name: studentName, role: "student" }}
            readOnly={false}
          />
        </div>
      </div>
    </div>
  );
}
