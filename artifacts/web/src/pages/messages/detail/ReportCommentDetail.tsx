/**
 * ReportCommentDetail — 周报评论消息详情
 *
 * Layer: component (pure, receives message + navigation callback)
 */

import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import type { Message, ReportCommentMeta } from "../../../types/messages";

interface Props {
  message: Message;
}

export function ReportCommentDetail({ message }: Props) {
  const [, navigate] = useLocation();
  const meta = (message.metadata ?? {}) as unknown as ReportCommentMeta;

  function handleViewReport() {
    if (meta.reportId) {
      navigate(`/personal/my-reports?reportId=${meta.reportId}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Icon + header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} className="text-violet-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-violet-700">周报评论</p>
          <p className="text-sm font-bold text-gray-900 leading-snug">{message.title}</p>
        </div>
      </div>

      {/* Report reference */}
      <div className="border border-violet-100 rounded-xl p-4 bg-violet-50">
        <p className="text-[10px] text-violet-600 font-medium mb-1">周报</p>
        <p className="text-sm font-semibold text-violet-900">
          {meta.reportTitle ?? message.title}
        </p>
        {meta.reportDateRange && (
          <p className="text-xs text-violet-600 mt-0.5">{meta.reportDateRange}</p>
        )}
      </div>

      {/* Comment bubble */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500 font-medium">评论内容</p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            「{meta.commentPreview ?? message.body}」
          </p>
          <p className="text-[10px] text-gray-400 mt-2">— {message.senderName}</p>
        </div>
      </div>

      {/* View report button */}
      <button
        onClick={handleViewReport}
        className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        <ExternalLink size={14} />
        查看周报
      </button>
    </div>
  );
}
