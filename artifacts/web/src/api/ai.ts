/**
 * AI API 客户端
 *
 * GET  /api/ai/status            — 检查 AI 服务是否可用
 * POST /api/ai/chat              — 工作台对话（现有功能）
 * POST /api/ai/extract-ontology  — 实验初始化本体信息提取
 */

import type { WizardFormData } from "@/types/wizardForm";
import { apiFetch } from "./client";

export interface AiStatusResponse {
  available: boolean;
}

export function getAiStatus(): Promise<AiStatusResponse> {
  return apiFetch<AiStatusResponse>("/ai/status");
}

export interface ExtractOntologyRequest {
  /** 参考文献的纯文本内容（从上传文件读取，可为空） */
  referenceContent?: string;
  /** 用户提供的实验标题/描述（辅助提取，可为空） */
  hint?: string;
}

/**
 * POST /api/ai/extract-ontology
 *
 * 向后端发送参考文献文本，获取 AI 提取的结构化实验本体信息（WizardFormData）。
 * 返回的数据可直接传入 form.populateFromAI()。
 */
export function extractOntology(req: ExtractOntologyRequest): Promise<WizardFormData> {
  return apiFetch<WizardFormData>("/ai/extract-ontology", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
