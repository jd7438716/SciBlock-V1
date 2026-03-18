/**
 * shares — 前端数据访问层
 *
 * Layer: api (thin fetch wrapper)
 *
 * 所有分享相关的 HTTP 调用都经过此模块，组件层不直接调用 fetch。
 * 用户身份通过 apiFetch 统一注入的 Authorization: Bearer header 传递。
 */

import { apiFetch } from "./client";
import type {
  ShareListResponse,
  ShareDetailResponse,
  Share,
  ShareRecipient,
  UserSearchResult,
  CreateSharePayload,
} from "../types/share";

// ---------------------------------------------------------------------------
// Share operations
// ---------------------------------------------------------------------------

/** Fetch all recipients for a given resource (owner only). */
export function fetchShareRecipients(
  resourceType: string,
  resourceId: string,
  ownerId: string,
): Promise<ShareListResponse> {
  const params = new URLSearchParams({ resourceType, resourceId, ownerId });
  return apiFetch<ShareListResponse>(`/shares?${params}`);
}

/** Fetch a single share record (owner or recipient). */
export function fetchShare(shareId: string): Promise<ShareDetailResponse> {
  return apiFetch<ShareDetailResponse>(`/shares/${shareId}`);
}

/** Create a new share. */
export function createShare(payload: CreateSharePayload): Promise<{ share: Share }> {
  return apiFetch<{ share: Share }>("/shares", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Revoke (delete) a share. */
export function revokeShare(shareId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/shares/${shareId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// User search (for the share modal people-picker)
// ---------------------------------------------------------------------------

/** Search users by name or email. Excludes the caller themselves. */
export function searchUsers(query: string): Promise<{ users: UserSearchResult[] }> {
  const params = new URLSearchParams({ q: query.trim() });
  return apiFetch<{ users: UserSearchResult[] }>(`/users/search?${params}`);
}
