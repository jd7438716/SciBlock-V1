/**
 * messages — 前端类型定义
 *
 * Layer: types (pure data contracts, no side effects)
 */

// ---------------------------------------------------------------------------
// Core enum values
// ---------------------------------------------------------------------------

export type MessageType =
  | "invitation"
  | "comment"
  | "share_request"
  | "report_comment"
  | "experiment_shared"
  | "report_shared"
  | "share_sent";

export type MessageStatus =
  | "unread"
  | "read"
  | "accepted"
  | "rejected"
  | "deleted";

// ---------------------------------------------------------------------------
// Per-type metadata (stored as JSON in DB, typed here for consumers)
// ---------------------------------------------------------------------------

export interface InvitationMeta {
  teamName: string;
  teamId: string;
}

export interface CommentMeta {
  experimentTitle: string;
  experimentId: string;
  comment: string;
}

export interface ShareRequestMeta {
  experimentTitle: string;
  experimentId: string;
}

/** Metadata for experiment_shared and report_shared (received by recipient) */
export interface ReceivedShareMeta {
  shareId: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  ownerName: string;
}

/** Metadata for share_sent (sender's own tracking message) */
export interface ShareSentMeta {
  shareId: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  recipientName: string;
  recipientEmail: string;
}

export interface ReportCommentMeta {
  reportId: string;
  reportTitle: string;
  reportDateRange: string;
  commentPreview: string;
}

export type MessageMetadata = InvitationMeta | CommentMeta | ShareRequestMeta | ReportCommentMeta;

// ---------------------------------------------------------------------------
// Message entity
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  recipientId: string;
  senderName: string;
  type: MessageType;
  status: MessageStatus;
  title: string;
  body: string;
  metadata: Record<string, string>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API request / response shapes
// ---------------------------------------------------------------------------

export interface MessagesListResponse {
  messages: Message[];
}

export interface MessageActionRequest {
  action: "accepted" | "rejected";
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Human-readable label for each message type */
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  invitation:          "团队邀请",
  comment:             "实验评论",
  share_request:       "分享请求",
  report_comment:      "周报评论",
  experiment_shared:   "收到分享",
  report_shared:       "收到分享",
  share_sent:          "分享记录",
};

/** Color token per message type  (Tailwind bg + text) */
export const MESSAGE_TYPE_COLORS: Record<
  MessageType,
  { bg: string; text: string; dot: string }
> = {
  invitation:          { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  comment:             { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  share_request:       { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400"  },
  report_comment:      { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  experiment_shared:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-400"   },
  report_shared:       { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-400"   },
  share_sent:          { bg: "bg-gray-50",   text: "text-gray-600",   dot: "bg-gray-400"   },
};
