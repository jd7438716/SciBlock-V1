/**
 * LinkedExperimentsSection — displays experiment records linked to a weekly
 * report, with an optional "管理关联" button for editable reports.
 *
 * Layer: business component (fetches linked records, conditionally opens
 * LinkEditModal)
 *
 * Supports both date models:
 *   isNewDateModel = true  → LinkEditModal uses candidate-experiments endpoint
 *   isNewDateModel = false → LinkEditModal uses legacy date-range preview
 */

import React, { useState, useEffect } from "react";
import { Link2, FlaskConical, Pencil, Loader2 } from "lucide-react";
import { LinkEditModal } from "./LinkEditModal";
import type { LinkedExperiment } from "@/types/weeklyReport";
import { EXP_STATUS_COLORS } from "@/types/weeklyReport";
import { fetchReportLinks } from "@/api/weeklyReport";

interface LinkedExperimentsSectionProps {
  reportId: string;
  isNewDateModel: boolean;
  reportDateStart: string | null;
  reportDateEnd: string | null;
  isEditable: boolean;
}

export function LinkedExperimentsSection({
  reportId,
  isNewDateModel,
  reportDateStart,
  reportDateEnd,
  isEditable,
}: LinkedExperimentsSectionProps) {
  const [linked,    setLinked]    = useState<LinkedExperiment[]>([]);
  const [loading,   setLoading]   = useState(true);
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
            <span className="text-xs text-gray-400">
              {linked.length > 0 ? `${linked.length} 条` : "未关联"}
            </span>
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
          isNewDateModel={isNewDateModel}
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
