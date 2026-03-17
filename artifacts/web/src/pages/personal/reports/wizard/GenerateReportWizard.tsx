/**
 * GenerateReportWizard — 自动汇总报告生成向导（3 步）
 *
 * Step 1: 选择时间范围 + 填写报告标题
 * Step 2: 预览命中的实验记录（来自 /reports/preview）
 * Step 3: 确认并生成（创建报告 → 触发汇总 → 轮询完成）
 *
 * Props:
 *   onComplete(report) — 生成完成后回调，传入最终报告
 *   onCancel           — 取消向导
 */

import React, { useState, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, XCircle,
  CalendarRange, FlaskConical, ChevronRight,
} from "lucide-react";
import {
  fetchReportPreview,
  createReport,
  triggerGenerate,
  pollUntilGenerated,
} from "@/api/weeklyReport";
import type { WeeklyReport, ReportPreviewExperiment } from "@/types/weeklyReport";
import { EXP_STATUS_COLORS, getWeekMonday, getWeekSunday, fmtDate } from "@/types/weeklyReport";

// ---------------------------------------------------------------------------
// Types / helpers
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;

interface WizardState {
  title: string;
  dateStart: string;
  dateEnd: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultDateRange(): { start: string; end: string } {
  const now = new Date();
  return { start: getWeekMonday(now), end: getWeekSunday(now) };
}

// ---------------------------------------------------------------------------
// Step 1 — Date range + title
// ---------------------------------------------------------------------------

interface Step1Props {
  state: WizardState;
  onChange: (s: WizardState) => void;
  onNext: () => void;
  onCancel: () => void;
}

function Step1({ state, onChange, onNext, onCancel }: Step1Props) {
  const invalid = !state.dateStart || !state.dateEnd || state.dateStart > state.dateEnd;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">选择汇总时间范围</h3>
        <p className="text-sm text-gray-500">系统将自动检索你在此时间段内的全部实验记录进行汇总。</p>
      </div>

      {/* Date inputs */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">开始日期</label>
          <input
            type="date"
            value={state.dateStart}
            max={todayISO()}
            onChange={(e) => onChange({ ...state, dateStart: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">结束日期</label>
          <input
            type="date"
            value={state.dateEnd}
            max={todayISO()}
            onChange={(e) => onChange({ ...state, dateEnd: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">报告标题</label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          placeholder="例：2026年3月实验汇总"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="text-xs text-gray-400 mt-1">留空将使用默认标题</p>
      </div>

      {/* Validation hint */}
      {state.dateStart && state.dateEnd && state.dateStart > state.dateEnd && (
        <p className="text-xs text-red-600">结束日期必须晚于或等于开始日期</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onNext}
          disabled={invalid}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          预览实验记录
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Preview experiments
// ---------------------------------------------------------------------------

interface Step2Props {
  state: WizardState;
  onBack: () => void;
  onNext: () => void;
}

function Step2({ state, onBack, onNext }: Step2Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experiments, setExperiments] = useState<ReportPreviewExperiment[]>([]);
  const [sciNoteCount, setSciNoteCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchReportPreview(state.dateStart, state.dateEnd)
      .then((res) => {
        if (cancelled) return;
        setExperiments(res.experiments);
        setSciNoteCount(res.sciNoteCount);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "加载失败");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [state.dateStart, state.dateEnd]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">预览将纳入汇总的实验</h3>
        <p className="text-sm text-gray-500">
          {fmtDate(state.dateStart)} – {fmtDate(state.dateEnd)}
        </p>
      </div>

      {/* Content */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white min-h-[160px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-violet-500 mr-2" />
            <span className="text-sm text-gray-500">检索中…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10 text-red-500 text-sm gap-2">
            <XCircle size={16} />
            {error}
          </div>
        ) : experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <FlaskConical size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500">该时间段内没有实验记录</p>
            <p className="text-xs text-gray-400">请返回上一步调整时间范围</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border-b border-violet-100">
              <CheckCircle2 size={15} className="text-violet-600" />
              <span className="text-sm text-violet-700 font-medium">
                找到 {experiments.length} 条实验，涉及 {sciNoteCount} 个项目
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
              {experiments.map((e) => (
                <div key={e.id} className="flex items-center px-4 py-2.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 truncate">{e.sciNoteTitle}</p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      EXP_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} />
          上一步
        </button>
        <button
          onClick={onNext}
          disabled={loading || experiments.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          确认，开始汇总
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Generating
// ---------------------------------------------------------------------------

interface Step3Props {
  state: WizardState;
  onComplete: (report: WeeklyReport) => void;
  onError: (msg: string) => void;
}

function Step3({ state, onComplete, onError }: Step3Props) {
  const [phase, setPhase] = useState<"creating" | "generating" | "done" | "failed">("creating");
  const [failMsg, setFailMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1. Create the report record
        setPhase("creating");
        const defaultTitle = `${fmtDate(state.dateStart)}–${fmtDate(state.dateEnd)} 实验汇总`;
        const report = await createReport({
          title: state.title.trim() || defaultTitle,
          weekStart: state.dateStart,
          weekEnd: state.dateEnd,
          dateRangeStart: state.dateStart,
          dateRangeEnd: state.dateEnd,
          status: "draft",
        });
        if (cancelled) return;

        // 2. Trigger generation (202 Accepted)
        setPhase("generating");
        await triggerGenerate(report.id);
        if (cancelled) return;

        // 3. Poll until done
        const finalReport = await pollUntilGenerated(report.id);
        if (cancelled) return;

        if (finalReport.generationStatus === "failed") {
          setPhase("failed");
          setFailMsg("汇总生成失败，请稍后重试。");
          onError("汇总生成失败");
        } else {
          setPhase("done");
          setTimeout(() => {
            if (!cancelled) onComplete(finalReport);
          }, 800);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "生成失败";
        setPhase("failed");
        setFailMsg(msg);
        onError(msg);
      }
    }

    void run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {(phase === "creating" || phase === "generating") && (
        <>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-violet-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 mb-1">
              {phase === "creating" ? "正在创建报告…" : "自动汇总中…"}
            </p>
            <p className="text-sm text-gray-500">
              {phase === "creating"
                ? "正在初始化报告记录"
                : "正在分析实验数据，生成结构化汇总报告"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${phase === "creating" ? "bg-violet-600" : "bg-violet-200"}`} />
            <span className={`w-2 h-2 rounded-full ${phase === "generating" ? "bg-violet-600 animate-pulse" : "bg-violet-200"}`} />
          </div>
        </>
      )}

      {phase === "done" && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={30} className="text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 mb-1">汇总完成！</p>
            <p className="text-sm text-gray-500">即将跳转至报告详情…</p>
          </div>
        </>
      )}

      {phase === "failed" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={30} className="text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 mb-1">汇总失败</p>
            <p className="text-sm text-gray-500">{failMsg}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GenerateReportWizard (main)
// ---------------------------------------------------------------------------

interface Props {
  onComplete: (report: WeeklyReport) => void;
  onCancel: () => void;
}

export function GenerateReportWizard({ onComplete, onCancel }: Props) {
  const { start, end } = defaultDateRange();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>({
    title: "",
    dateStart: start,
    dateEnd: end,
  });
  const [genError, setGenError] = useState<string | null>(null);

  const stepLabels: Record<Step, string> = {
    1: "选择时间段",
    2: "确认实验",
    3: "生成报告",
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="max-w-xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  step === s
                    ? "text-violet-700"
                    : step > s
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s
                      ? "bg-violet-600 text-white"
                      : step > s
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                {stepLabels[s]}
              </div>
              {s < 3 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-6">
          {step === 1 && (
            <Step1
              state={state}
              onChange={setState}
              onNext={() => setStep(2)}
              onCancel={onCancel}
            />
          )}
          {step === 2 && (
            <Step2
              state={state}
              onBack={() => setStep(1)}
              onNext={() => { setGenError(null); setStep(3); }}
            />
          )}
          {step === 3 && !genError && (
            <Step3
              state={state}
              onComplete={onComplete}
              onError={setGenError}
            />
          )}
          {step === 3 && genError && (
            <div className="flex flex-col items-center gap-4 py-6">
              <XCircle size={36} className="text-red-400" />
              <p className="text-sm text-gray-700 text-center">{genError}</p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回列表
                </button>
                <button
                  onClick={() => { setGenError(null); }}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        {step < 3 && (
          <p className="text-xs text-gray-400 text-center">
            自动汇总基于实验记录数据生成，生成后仍可手动编辑或补充。
          </p>
        )}
      </div>
    </div>
  );
}
