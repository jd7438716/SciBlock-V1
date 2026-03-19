/**
 * ai-client.service.ts
 *
 * Shared OpenAI-compatible API client used by:
 *   - /api/ai routes (chat, extract-ontology)
 *   - report-generation.service.ts (weekly report LLM generation)
 *
 * Provider selection via environment variables:
 *   AI_PROVIDER  = "qianwen" (default) | "openai" | "local"
 *   For qianwen: DASHSCOPE_API_KEY, AI_MODEL (default: qwen-plus)
 *   For openai:  OPENAI_API_KEY, AI_BASE_URL, AI_MODEL (default: gpt-4o-mini)
 *   For local:   LOCAL_AI_API_KEY, LOCAL_AI_BASE_URL, AI_MODEL (default: llama3)
 */

export interface ProviderConfig {
  baseUrl: string;
  model:   string;
  apiKey:  string;
}

// ---------------------------------------------------------------------------
// Provider selection — reads env vars at call time (not module load time)
// ---------------------------------------------------------------------------

export function buildProviderConfig(): ProviderConfig | null {
  const provider = process.env.AI_PROVIDER ?? "qianwen";

  switch (provider) {
    case "qianwen": {
      const apiKey = process.env.DASHSCOPE_API_KEY ?? "";
      if (!apiKey) return null;
      return {
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model:   process.env.AI_MODEL ?? "qwen-plus",
        apiKey,
      };
    }

    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) return null;
      return {
        baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
        model:   process.env.AI_MODEL ?? "gpt-4o-mini",
        apiKey,
      };
    }

    case "local": {
      const apiKey = process.env.LOCAL_AI_API_KEY ?? "local";
      return {
        baseUrl: process.env.LOCAL_AI_BASE_URL ?? "http://localhost:11434/v1",
        model:   process.env.AI_MODEL ?? "llama3",
        apiKey,
      };
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// callChat — streaming-compatible text response
// ---------------------------------------------------------------------------

export async function callChat(
  config: ProviderConfig,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens:  1024,
  };

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${config.apiKey}`,
    },
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Provider returned empty reply");
  return reply;
}

// ---------------------------------------------------------------------------
// callChatJson — enforces JSON output via response_format
// ---------------------------------------------------------------------------

/**
 * Calls the LLM with response_format: json_object to enforce structured output.
 * Returns the raw JSON string from the model.
 * Throws on HTTP error, timeout, or empty reply.
 */
export async function callChatJson(
  config: ProviderConfig,
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 60_000,
): Promise<string> {
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage },
    ],
    temperature:     0.3,
    max_tokens:      4096,
    response_format: { type: "json_object" },
  };

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${config.apiKey}`,
    },
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Provider returned empty reply");
  return reply;
}
