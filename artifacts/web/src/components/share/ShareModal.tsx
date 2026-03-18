/**
 * ShareModal — user picker dialog for sharing content.
 *
 * Layer: component (controls search, add, revoke)
 *
 * Layout:
 *   ┌──────────────────────────────────┐
 *   │ 分享给                         ✕ │
 *   ├──────────────────────────────────┤
 *   │ 🔍 搜索邮箱或姓名...            │
 *   │ ─── 搜索结果 ──────────────────  │
 *   │  ○ 张三 zhang@...   [+ 分享]    │
 *   │  ○ 李四 li@...      [+ 分享]    │
 *   ├──────────────────────────────────┤
 *   │ 已分享给                         │
 *   │  ◉ 王五 wang@...   [撤销]       │
 *   └──────────────────────────────────┘
 *
 * Responsibilities:
 *   - Debounced user search (300 ms)
 *   - Add share (calls onAdd + shows success/error toast)
 *   - Revoke share (calls onRemove)
 *   - Renders current share list
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, UserPlus, Trash2, Loader2 } from "lucide-react";
import { searchUsers } from "@/api/shares";
import type { UserSearchResult, ShareRecipient } from "@/types/share";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchResultRow({
  user,
  isAlreadyShared,
  onShare,
}: {
  user: UserSearchResult;
  isAlreadyShared: boolean;
  onShare: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      await onShare();
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500">
            {user.name[0]?.toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
      </div>
      {isAlreadyShared ? (
        <span className="text-xs text-gray-400 px-2">已分享</span>
      ) : (
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors px-2 py-1 rounded"
        >
          {sharing ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
          分享
        </button>
      )}
    </div>
  );
}

function RecipientRow({
  recipient,
  onRevoke,
}: {
  recipient: ShareRecipient;
  onRevoke: () => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const initials = recipient.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleRevoke() {
    setRevoking(true);
    try {
      await onRevoke();
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-indigo-700">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{recipient.name}</p>
          <p className="text-xs text-gray-400 truncate">{recipient.email}</p>
        </div>
      </div>
      <button
        onClick={handleRevoke}
        disabled={revoking}
        title="撤销分享"
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-all p-1 rounded"
      >
        {revoking ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface Props {
  /** Human-readable content title, shown in the modal header */
  resourceTitle: string;
  /** Current list of recipients */
  recipients: ShareRecipient[];
  onAdd: (email: string) => Promise<void>;
  onRemove: (shareId: string) => Promise<void>;
  onClose: () => void;
}

export function ShareModal({ resourceTitle, recipients, onAdd, onRemove, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on open.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape.
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(query);
        setResults(data.users);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const showFeedback = useCallback((text: string, ok: boolean) => {
    setFeedbackMsg({ text, ok });
    setTimeout(() => setFeedbackMsg(null), 3000);
  }, []);

  const sharedUserIds = new Set(recipients.map((r) => r.userId));

  async function handleShare(user: UserSearchResult) {
    try {
      await onAdd(user.email);
      showFeedback(`已分享给 ${user.name}`, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "分享失败";
      showFeedback(msg, false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">分享内容</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
              {resourceTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors ml-4"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[480px] overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索姓名或邮箱..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Feedback */}
          {feedbackMsg && (
            <p
              className={[
                "text-xs px-3 py-2 rounded-lg",
                feedbackMsg.ok
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600",
              ].join(" ")}
            >
              {feedbackMsg.text}
            </p>
          )}

          {/* Search results */}
          {query.trim() && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
                搜索结果
              </p>
              {searching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="animate-spin text-gray-300" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">没有找到匹配的用户</p>
              ) : (
                <div>
                  {results.map((u) => (
                    <SearchResultRow
                      key={u.id}
                      user={u}
                      isAlreadyShared={sharedUserIds.has(u.id)}
                      onShare={() => handleShare(u)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current recipients */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
              已分享给 {recipients.length > 0 ? `(${recipients.length})` : ""}
            </p>
            {recipients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">尚未分享给任何人</p>
            ) : (
              <div>
                {recipients.map((r) => (
                  <RecipientRow
                    key={r.shareId}
                    recipient={r}
                    onRevoke={() => onRemove(r.shareId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
