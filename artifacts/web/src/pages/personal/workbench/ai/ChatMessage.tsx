/**
 * ChatMessage — 单条聊天气泡
 *
 * Layer: component (pure, controlled, no side effects)
 *
 * 布局规则:
 *   user      → 右对齐, 深色气泡
 *   assistant → 左对齐, 浅色气泡
 *   pending   → 三点闪动加载动画
 */

import React from "react";
import type { ChatMessage as ChatMessageType } from "../../../../types/aiChat";

interface Props {
  message: ChatMessageType;
}

/** Format ISO string → HH:mm */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={[
          "max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-gray-900 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200",
        ].join(" ")}
      >
        {message.pending ? <ThinkingDots /> : message.content}
      </div>
      <span className="text-[10px] text-gray-400 px-1">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
