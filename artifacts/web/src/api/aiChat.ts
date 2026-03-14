/**
 * AI 对话 — 前端数据访问层
 *
 * Layer: api  (thin fetch wrapper, callers never import fetch directly)
 *
 * All AI communication goes through our own backend `/api/ai/chat`.
 * The backend owns the API key and provider selection — the frontend is
 * completely decoupled from which AI vendor is active.
 */

import type {
  AiChatRequest,
  AiChatResponse,
  AiChatErrorResponse,
} from "../types/aiChat";

const AI_CHAT_ENDPOINT = "/api/ai/chat";

export class AiApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AiApiError";
  }
}

/**
 * Send a chat request to the backend and receive the AI reply.
 *
 * @throws {AiApiError} on non-2xx responses or network failures
 */
export async function sendChatMessage(
  request: AiChatRequest,
): Promise<AiChatResponse> {
  let res: Response;

  try {
    res = await fetch(AI_CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new AiApiError("network_error", "网络异常，请检查连接后重试");
  }

  if (!res.ok) {
    let body: AiChatErrorResponse = { error: "unknown_error" };
    try {
      body = (await res.json()) as AiChatErrorResponse;
    } catch {
      // ignore parse errors
    }
    throw new AiApiError(
      body.error,
      body.message ?? `AI 服务响应错误 (${res.status})`,
    );
  }

  return res.json() as Promise<AiChatResponse>;
}
