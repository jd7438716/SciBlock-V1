/**
 * ShareSentDetail — 分享记录消息详情（分享人自己的追踪消息）
 *
 * Layer: component (pure display)
 *
 * 用于 type = 'share_sent' 的消息。
 * 显示分享出去的内容名称和接收人信息。
 * 不显示"撤销"操作 — 撤销逻辑在 ShareModal 中完成。
 */

import React from "react";
import { Send, FileText, FlaskConical, User } from "lucide-react";
import type { Message, ShareSentMeta } from "@/types/messages";

interface Props {
  message: Message;
}

export function ShareSentDetail({ message }: Props) {
  const meta = (message.metadata ?? {}) as unknown as ShareSentMeta;
  const isExperiment = meta.resourceType === "experiment_record";
  const contentTypeLabel = isExperiment ? "实验记录" : "周报";
  const ContentIcon = isExperiment ? FlaskConical : FileText;

  return (
    <div className="flex flex-col gap-6">
      {/* Icon + header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Send size={18} className="text-gray-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">分享记录</p>
          <p className="text-sm font-bold text-gray-900 leading-snug">{message.title}</p>
        </div>
      </div>

      {/* Content reference */}
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-start gap-3">
        <ContentIcon size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">{contentTypeLabel}</p>
          <p className="text-sm font-semibold text-gray-800">
            《{meta.resourceTitle ?? message.body}》
          </p>
        </div>
      </div>

      {/* Recipient info */}
      {meta.recipientName && (
        <div className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">已分享给</p>
            <p className="text-sm font-medium text-gray-800">{meta.recipientName}</p>
            {meta.recipientEmail && (
              <p className="text-xs text-gray-400">{meta.recipientEmail}</p>
            )}
          </div>
        </div>
      )}

      {/* Informational note */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        如需撤销分享，请在原{contentTypeLabel}的分享面板中操作。
      </p>
    </div>
  );
}
