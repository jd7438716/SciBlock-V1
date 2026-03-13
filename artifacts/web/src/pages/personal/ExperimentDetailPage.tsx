import React from "react";
import { useParams } from "wouter";
import { BookOpen, FlaskConical, Target, Package, Wrench, BarChart2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSciNoteStore } from "@/contexts/SciNoteStoreContext";
import type { WizardFormData } from "@/types/wizardForm";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {value || <span className="text-gray-300 italic">未填写</span>}
      </p>
    </div>
  );
}

interface SummaryProps {
  data: WizardFormData;
}

function ExperimentSummary({ data }: SummaryProps) {
  const { step2, step3, step4, step5 } = data;
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: goal spans full width */}
      {step2.goal && (
        <InfoCard
          icon={<Target size={14} />}
          label="实验目标"
          value={step2.goal}
        />
      )}

      {/* Row 2: materials + environment */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={<Package size={14} />}
          label="所需材料"
          value={step3.materials}
        />
        <InfoCard
          icon={<FlaskConical size={14} />}
          label="实验环境 / 估计时长"
          value={[step3.environment, step3.estimatedTime].filter(Boolean).join(" · ")}
        />
      </div>

      {/* Row 3: operations + cautions */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={<Wrench size={14} />}
          label="操作步骤"
          value={step4.operationSteps}
        />
        <InfoCard
          icon={<Wrench size={14} />}
          label="注意事项"
          value={step4.cautions}
        />
      </div>

      {/* Row 4: metrics + method + instruments */}
      <InfoCard
        icon={<BarChart2 size={14} />}
        label="测量指标 · 方法 · 仪器"
        value={[step5.metrics, step5.method, step5.instruments].filter(Boolean).join("\n")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { notes } = useSciNoteStore();
  const note = notes.find((n) => n.id === id);

  if (!note) {
    return (
      <AppLayout title="实验记录">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen size={36} className="text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-500">找不到该实验记录</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={note.title}>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* Experiment meta header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900">{note.title}</h1>
          {note.formData?.step2.experimentType && (
            <p className="text-sm text-gray-400">{note.formData.step2.experimentType}</p>
          )}
          {note.createdAt && (
            <p className="text-xs text-gray-300">
              创建于 {new Date(note.createdAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>

        {/* Summary info from initialization */}
        {note.formData ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">实验基础信息</h2>
            <ExperimentSummary data={note.formData} />
          </section>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 text-sm text-gray-400">
            该记录未包含初始化表单数据。
          </div>
        )}

        {/* Placeholder: experiment record content */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">实验记录内容</h2>
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-10 flex flex-col items-center justify-center text-center gap-2">
            <BookOpen size={28} className="text-gray-200" />
            <p className="text-sm text-gray-400 font-medium">后续在这里进入正式实验记录流程</p>
            <p className="text-xs text-gray-300">实验记录编辑器 — 功能开发中</p>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
