/**
 * AI 路由
 *
 * POST /api/ai/chat              — 工作台对话面板
 * POST /api/ai/extract-ontology  — 实验初始化本体信息提取
 * GET  /api/ai/status            — 检查 AI 服务是否可用
 *
 * 通过 AI_PROVIDER 环境变量选择模型后端：
 *   qianwen (默认) — 阿里云 DashScope OpenAI 兼容接口 (DASHSCOPE_API_KEY)
 *   openai         — OpenAI 官方 API 或任意兼容接口 (OPENAI_API_KEY + 可选 AI_BASE_URL)
 *   local          — 本地 OpenAI 兼容部署
 */

import { Router, type IRouter } from "express";
import crypto from "crypto";
import {
  buildProviderConfig,
  callChat,
  callChatJson,
} from "../services/ai-client.service";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemContext?: string;
}

// ---------------------------------------------------------------------------
// Chat system prompt
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `你是 SciBlock 实验助手，一个专业的科学实验 AI 顾问。
你的职责是帮助科研人员分析实验数据、提出改进建议、解释实验现象，以及回答与实验相关的科学问题。
请使用简洁、专业的中文回答，必要时可以使用 Markdown 格式（粗体、列表、代码块等）提升可读性。
不要回答与科学实验无关的话题。`;

function buildSystemPrompt(experimentContext?: string): string {
  if (!experimentContext) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}

## 当前实验上下文
${experimentContext}

请优先基于以上实验上下文回答用户问题。`;
}

// ---------------------------------------------------------------------------
// Ontology extraction prompt
// ---------------------------------------------------------------------------

const EXTRACT_SYSTEM_PROMPT = `你是一个科学实验信息提取助手。
用户会提供实验参考文献或实验描述，你需要从中提取结构化实验本体信息，并以 JSON 格式输出。

## 输出格式（严格遵循，所有字段必须存在）

\`\`\`json
{
  "step2": {
    "fields": [
      { "name": "实验名称",   "type": "text",   "value": "<实验完整名称>", "items": [], "objects": [] },
      { "name": "实验类型",   "type": "text",   "value": "<实验类型>",     "items": [], "objects": [] },
      { "name": "实验目标",   "type": "text",   "value": "<实验目标描述>", "items": [], "objects": [] },
      { "name": "研究假设",   "type": "text",   "value": "<研究假设>",     "items": [], "objects": [] },
      {
        "name": "研究对象", "type": "object", "value": "", "items": [],
        "objects": [
          { "name": "<材料/样品名>", "tags": [{ "key": "<属性名>", "value": "<属性值>" }] }
        ]
      },
      {
        "name": "实验设备", "type": "object", "value": "", "items": [],
        "objects": [
          { "name": "<设备名>", "tags": [{ "key": "<参数名>", "value": "<参数值>" }] }
        ]
      }
    ]
  },
  "step3": {
    "items": [
      {
        "name": "<准备项名称>",
        "category": "<准备材料|准备设备|环境条件|前处理事项>",
        "attributes": [{ "key": "<属性名>", "value": "<属性值>" }],
        "description": "<可选描述>"
      }
    ]
  },
  "step4": {
    "items": [
      {
        "order": 1,
        "name": "<操作步骤名称>",
        "params": [{ "key": "<参数名>", "value": "<参数值>" }],
        "notes": "<可选备注>"
      }
    ]
  },
  "step5": {
    "items": [
      {
        "name": "<测量项名称>",
        "instrument": "<仪器名称>",
        "method": "<测量方法>",
        "target": "<测量目标>",
        "conditions": [{ "key": "<条件名>", "value": "<条件值>" }]
      }
    ]
  },
  "step6": {
    "items": [
      {
        "name": "<数据项名称>",
        "attributes": [{ "key": "<属性名>", "value": "<属性值>" }],
        "description": "<数据用途描述>"
      }
    ]
  }
}
\`\`\`

## 规则
1. 所有内容使用中文。
2. 只提取参考文献中明确包含的信息，不要编造数据。
3. 如果某个字段找不到信息，用空字符串或空数组占位，不要省略字段。
4. ID 字段不需要输出，后端会自动生成。
5. step4.items 中 order 从 1 开始连续编号。
6. 直接输出 JSON，不要添加任何 markdown 代码块或额外说明文字。`;

function buildExtractionUserMessage(referenceContent?: string, hint?: string): string {
  const parts: string[] = [];

  if (hint?.trim()) {
    parts.push(`实验提示信息：${hint.trim()}`);
  }

  if (referenceContent?.trim()) {
    const truncated = referenceContent.trim().slice(0, 12000);
    parts.push(`参考文献内容：\n${truncated}`);
  }

  if (parts.length === 0) {
    parts.push("请根据通用科学实验模板提取本体信息框架（各字段留空，仅建立结构）。");
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// ID normalizer — assigns stable IDs to all items parsed from LLM output
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID().split("-")[0];
}

function normalizeTag(t: Record<string, unknown>): { id: string; key: string; value: string } {
  return {
    id:    uid(),
    key:   String(t.key   ?? ""),
    value: String(t.value ?? ""),
  };
}

function normalizeExtraction(raw: unknown): unknown {
  const src = raw as Record<string, unknown>;

  // ── step2 ──────────────────────────────────────────────────────────────────
  const s2src = (src.step2 as Record<string, unknown>) ?? {};
  const fields = ((s2src.fields ?? []) as Array<Record<string, unknown>>).map((f) => ({
    id:      uid(),
    name:    String(f.name  ?? ""),
    type:    String(f.type  ?? "text"),
    value:   String(f.value ?? ""),
    items:   Array.isArray(f.items)   ? (f.items as string[])    : [],
    objects: Array.isArray(f.objects) ? (f.objects as Array<Record<string, unknown>>).map((o) => ({
      id:   uid(),
      name: String(o.name ?? ""),
      tags: Array.isArray(o.tags) ? (o.tags as Array<Record<string, unknown>>).map(normalizeTag) : [],
    })) : [],
  }));

  // ── step3 ──────────────────────────────────────────────────────────────────
  const s3src = (src.step3 as Record<string, unknown>) ?? {};
  const prepItems = ((s3src.items ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id:          uid(),
    name:        String(item.name        ?? ""),
    category:    String(item.category    ?? "准备材料"),
    attributes:  Array.isArray(item.attributes) ? (item.attributes as Array<Record<string, unknown>>).map(normalizeTag) : [],
    description: item.description ? String(item.description) : undefined,
  }));

  // ── step4 ──────────────────────────────────────────────────────────────────
  const s4src = (src.step4 as Record<string, unknown>) ?? {};
  const opItems = ((s4src.items ?? []) as Array<Record<string, unknown>>).map((item, idx) => ({
    id:     uid(),
    order:  typeof item.order === "number" ? item.order : idx + 1,
    name:   String(item.name  ?? ""),
    params: Array.isArray(item.params) ? (item.params as Array<Record<string, unknown>>).map(normalizeTag) : [],
    notes:  item.notes ? String(item.notes) : undefined,
  }));

  // ── step5 ──────────────────────────────────────────────────────────────────
  const s5src = (src.step5 as Record<string, unknown>) ?? {};
  const measItems = ((s5src.items ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id:         uid(),
    name:       String(item.name       ?? ""),
    instrument: item.instrument ? String(item.instrument) : undefined,
    method:     item.method     ? String(item.method)     : undefined,
    target:     String(item.target     ?? ""),
    conditions: Array.isArray(item.conditions) ? (item.conditions as Array<Record<string, unknown>>).map(normalizeTag) : [],
  }));

  // ── step6 ──────────────────────────────────────────────────────────────────
  const s6src = (src.step6 as Record<string, unknown>) ?? {};
  const dataItems = ((s6src.items ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id:          uid(),
    name:        String(item.name        ?? ""),
    attributes:  Array.isArray(item.attributes) ? (item.attributes as Array<Record<string, unknown>>).map(normalizeTag) : [],
    description: item.description ? String(item.description) : undefined,
  }));

  return {
    step2: { fields },
    step3: { items: prepItems },
    step4: { items: opItems },
    step5: { items: measItems },
    step6: { items: dataItems },
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/ai/status
 * Public — no auth required.
 */
router.get("/status", (_req, res) => {
  const available = buildProviderConfig() !== null;
  res.json({ available });
});

/**
 * POST /api/ai/chat
 * Workbench conversation panel.
 */
router.post("/chat", async (req, res) => {
  const { messages, systemContext } = req.body as ChatRequest;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "bad_request", message: "messages 不能为空" });
    return;
  }

  const config = buildProviderConfig();
  if (!config) {
    res.status(503).json({
      error: "ai_not_configured",
      message: "AI 服务尚未配置。请联系管理员设置 DASHSCOPE_API_KEY（千问）或 OPENAI_API_KEY（OpenAI）环境变量。",
    });
    return;
  }

  try {
    const systemPrompt = buildSystemPrompt(systemContext);
    const reply = await callChat(config, systemPrompt, messages);
    res.json({ reply });
  } catch (err) {
    console.error("[AI] chat error:", err);
    res.status(502).json({ error: "ai_error", message: "AI 服务调用失败，请稍后重试" });
  }
});

/**
 * POST /api/ai/extract-ontology
 *
 * 从上传的参考文献文本中提取结构化实验本体信息。
 *
 * Request body:
 *   referenceContent?: string   — 参考文献纯文本（可为空）
 *   hint?:            string   — 用户输入的实验标题/描述（可为空）
 *
 * Response: WizardFormData JSON（step2–step6 全部字段，含稳定 ID）
 */
router.post("/extract-ontology", async (req, res) => {
  const { referenceContent, hint } = req.body as {
    referenceContent?: string;
    hint?: string;
  };

  const config = buildProviderConfig();
  if (!config) {
    res.status(503).json({
      error: "ai_not_configured",
      message: "AI 服务尚未配置，无法提取本体信息。",
    });
    return;
  }

  try {
    const userMessage = buildExtractionUserMessage(referenceContent, hint);
    const rawJson = await callChatJson(config, EXTRACT_SYSTEM_PROMPT, userMessage);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      console.error("[AI] extract-ontology: invalid JSON from model:", rawJson.slice(0, 300));
      res.status(502).json({ error: "ai_parse_error", message: "模型返回格式异常，请重试" });
      return;
    }

    const normalized = normalizeExtraction(parsed);
    res.json(normalized);
  } catch (err) {
    console.error("[AI] extract-ontology error:", err);
    res.status(502).json({ error: "ai_error", message: "AI 提取失败，请稍后重试" });
  }
});

export default router;
