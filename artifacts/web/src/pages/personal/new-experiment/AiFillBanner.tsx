import React from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

/**
 * AiFillBanner — shown at the top of steps 2–6 when AI has pre-filled content.
 * Signals that the content came from the reference file and is editable.
 */
export function AiFillBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5">
      <Sparkles size={14} className="flex-shrink-0 text-violet-500" />
      <p className="text-sm text-violet-700">
        <span className="font-medium">AI 自动填写</span>
        <span className="mx-1.5 text-violet-400">·</span>
        内容来自参考资料，可直接修改
      </p>
    </div>
  );
}

/**
 * AiExtractingBanner — shown while the LLM extraction call is in-flight.
 * Replaces the fill banner so users know the content is being generated.
 */
export function AiExtractingBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
      <Loader2 size={14} className="flex-shrink-0 text-blue-500 animate-spin" />
      <p className="text-sm text-blue-700">
        <span className="font-medium">AI 正在提取实验信息</span>
        <span className="mx-1.5 text-blue-400">·</span>
        请稍候，内容将自动填入各步骤
      </p>
    </div>
  );
}

/**
 * AiErrorBanner — shown when extraction failed.
 * Lets users know they should fill the form manually.
 */
export function AiErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
      <AlertCircle size={14} className="flex-shrink-0 text-amber-500" />
      <p className="text-sm text-amber-700">
        <span className="font-medium">AI 提取未完成</span>
        <span className="mx-1.5 text-amber-400">·</span>
        {message}，请手动填写以下内容
      </p>
    </div>
  );
}
