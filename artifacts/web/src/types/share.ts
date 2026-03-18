/**
 * share — 前端类型定义
 *
 * Layer: types (pure data contracts, no side effects)
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type ShareResourceType = "experiment_record" | "weekly_report";

/** A share record as returned by GET /api/shares/:id */
export interface Share {
  id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceTitle: string;
  ownerId: string;
  recipientId: string;
  createdAt: string;
}

/** A recipient as returned by GET /api/shares (list) */
export interface ShareRecipient {
  shareId: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

/** A user as returned by GET /api/users/search */
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// API request / response shapes
// ---------------------------------------------------------------------------

export interface CreateSharePayload {
  resourceType: ShareResourceType;
  resourceId: string;
  resourceTitle: string;
  recipientEmail: string;
}

export interface ShareListResponse {
  recipients: ShareRecipient[];
}

export interface ShareDetailResponse {
  share: Share;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
}
