/**
 * ReceivedShareDetail — 接收到分享的消息详情
 *
 * Layer: component (pure display)
 *
 * 用于 type = 'experiment_shared' 和 type = 'report_shared' 的消息。
 * 显示分享人、内容名称，以及"查看内容"按钮（跳转到 /shared/:shareId）。
 */

import React from "react";
import { Share2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { Message, ReceivedShareMeta } from "@/types/messages";

interface Props {
  message: Message;
}

export function ReceivedShareDetail({ message }: Props) {
  const meta = (message.metadata ?? {}) as unknown as ReceivedShareMeta;
  const isExperiment = message.type === "experiment_shared";
  const contentTypeLabel = isExperiment ? "实验记录" : "周报";

  return (
    <div className="flex flex-col gap-6">
      {/* Icon + header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Share2 size={18} className="text-teal-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-teal-700">收到分享</p>
          <p className="text-sm font-bold text-gray-900 leading-snug">{message.title}</p>
        </div>
      </div>

      {/* Content reference */}
      <div className="border border-teal-100 rounded-xl p-4 bg-teal-50">
        <p className="text-[10px] text-teal-600 font-medium mb-1">{contentTypeLabel}</p>
        <p className="text-sm font-semibold text-teal-900">
          《{meta.resourceTitle ?? message.body}》
        </p>
      </div>

      {/* Body text */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
        {message.senderName} 将这份{contentTypeLabel}分享给了你，点击下方按钮查看完整内容。
      </div>

      {/* View button */}
      {meta.shareId ? (
        <Link
          href={`/shared/${meta.shareId}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <ExternalLink size={14} />
          查看{contentTypeLabel}
        </Link>
      ) : (
        <p className="text-xs text-gray-400 text-center">链接已失效或分享已被撤销。</p>
      )}
    </div>
  );
}
