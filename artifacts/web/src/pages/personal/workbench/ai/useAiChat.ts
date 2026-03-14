/**
 * useAiChat — AI 对话业务逻辑层
 *
 * Layer: business logic (hook)
 *
 * 职责:
 *   - 维护消息历史、加载状态、错误信息
 *   - 调用 api/aiChat 发送消息并追加 AI 回复
 *   - 提供 send / clear / retry 动作
 *
 * 注意:
 *   - 组件层只操作此 hook 暴露的接口，不直接导入 api 层
 *   - systemContext 来自 WorkbenchContext（实验元信息），由 AiPanel 传入
 */

import { useState, useCallback, useRef } from "react";
import { sendChatMessage, AiApiError } from "../../../../api/aiChat";
import type { ChatMessage, ChatState } from "../../../../types/aiChat";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseAiChatReturn {
  state: ChatState;
  /** Send a user message and await AI reply */
  send: (text: string) => Promise<void>;
  /** Clear all messages and reset state */
  clear: () => void;
  /** Whether the chat can accept new input (not currently loading) */
  canSend: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAiChat(systemContext?: string): UseAiChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    status: "idle",
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        createdAt: now(),
      };

      const placeholderId = generateId();
      const placeholder: ChatMessage = {
        id: placeholderId,
        role: "assistant",
        content: "",
        createdAt: now(),
        pending: true,
      };

      setState((prev) => ({
        messages: [...prev.messages, userMessage, placeholder],
        status: "loading",
        error: null,
      }));

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const history = state.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        const response = await sendChatMessage({
          messages: [...history, { role: "user", content: trimmed }],
          systemContext,
        });

        const assistantMessage: ChatMessage = {
          id: placeholderId,
          role: "assistant",
          content: response.reply,
          createdAt: now(),
          pending: false,
        };

        setState((prev) => ({
          messages: prev.messages.map((m) =>
            m.id === placeholderId ? assistantMessage : m,
          ),
          status: "idle",
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof AiApiError
            ? err.message
            : "未知错误，请稍后重试";

        setState((prev) => ({
          messages: prev.messages.filter((m) => m.id !== placeholderId),
          status: "error",
          error: message,
        }));
      }
    },
    [state.messages, systemContext],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({ messages: [], status: "idle", error: null });
  }, []);

  return {
    state,
    send,
    clear,
    canSend: state.status !== "loading",
  };
}
