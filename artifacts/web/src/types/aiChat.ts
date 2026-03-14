/**
 * AI 对话 — 类型定义
 *
 * Layer: types (pure data contracts, no side effects)
 */

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO timestamp */
  createdAt: string;
  /** Only on assistant messages: true while streaming/waiting */
  pending?: boolean;
}

// ---------------------------------------------------------------------------
// Chat state
// ---------------------------------------------------------------------------

export type ChatStatus = "idle" | "loading" | "error";

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  /** Last error message from the API */
  error: string | null;
}

// ---------------------------------------------------------------------------
// API request / response shapes  (mirrors backend contract)
// ---------------------------------------------------------------------------

export interface AiChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  messages: AiChatRequestMessage[];
  /** Markdown-formatted experiment context injected as system prompt */
  systemContext?: string;
}

export interface AiChatResponse {
  reply: string;
}

export interface AiChatErrorResponse {
  error: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Model / provider config (used by the backend, exposed for UI reference)
// ---------------------------------------------------------------------------

export type AiProviderKey = "qianwen" | "openai" | "anthropic" | "local";

export interface AiProviderInfo {
  key: AiProviderKey;
  label: string;
  description: string;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  { key: "qianwen",   label: "千问 (Qianwen)", description: "阿里云 DashScope" },
  { key: "openai",    label: "OpenAI GPT",     description: "OpenAI 官方 API"  },
  { key: "anthropic", label: "Claude",          description: "Anthropic API"    },
  { key: "local",     label: "本地模型",         description: "自部署 OpenAI 兼容接口" },
];
