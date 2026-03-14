/**
 * ChatInput — 消息输入框 + 发送按钮
 *
 * Layer: component (controlled, fires onSend callback)
 *
 * 交互:
 *   - Enter 发送 (Shift+Enter 换行)
 *   - 发送后自动清空输入框并 focus
 *   - loading 时发送按钮禁用，显示 spinner
 */

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 p-2 border-t border-gray-100 bg-white">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "输入问题，Enter 发送…"}
        rows={2}
        className={[
          "flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2",
          "text-xs leading-relaxed outline-none transition-colors",
          "focus:border-gray-400 focus:bg-white",
          "placeholder:text-gray-400",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={[
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
          disabled || !text.trim()
            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-gray-700",
        ].join(" ")}
      >
        {disabled ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <SendHorizontal size={14} />
        )}
      </button>
    </div>
  );
}
