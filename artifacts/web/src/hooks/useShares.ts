/**
 * useShares — React hook for managing share state for a single resource.
 *
 * Layer: hooks (state management + side effects)
 *
 * Delegates all network calls to the api/shares module.
 * Components never call fetch directly.
 */

import { useState, useCallback, useEffect } from "react";
import {
  fetchShareRecipients,
  createShare,
  revokeShare,
} from "@/api/shares";
import type { ShareRecipient } from "@/types/share";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface UseSharesState {
  recipients: ShareRecipient[];
  loading: boolean;
  error: string | null;
}

interface UseSharesReturn extends UseSharesState {
  /** Load (or reload) the share list. Call once when the UI mounts. */
  load: () => Promise<void>;
  /** Add a share by the recipient's email address. Reloads the list on success. */
  addShare: (recipientEmail: string) => Promise<void>;
  /** Revoke a share by its ID. Removes from local state immediately. */
  removeShare: (shareId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useShares — manages the "shared with" list for a single piece of content.
 *
 * @param opts.resourceType  "experiment_record" | "weekly_report"
 * @param opts.resourceId    Primary key of the content being shared
 * @param opts.resourceTitle Human-readable title (stored in share records + messages)
 * @param opts.ownerId       The content owner's user ID (required for the list endpoint)
 */
export function useShares(opts: {
  resourceType: "experiment_record" | "weekly_report";
  resourceId: string;
  resourceTitle: string;
  ownerId: string;
}): UseSharesReturn {
  const { resourceType, resourceId, resourceTitle, ownerId } = opts;

  const [state, setState] = useState<UseSharesState>({
    recipients: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchShareRecipients(resourceType, resourceId, ownerId);
      setState({ recipients: data.recipients, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: "加载分享列表失败" }));
    }
  }, [resourceType, resourceId, ownerId]);

  const addShare = useCallback(
    async (recipientEmail: string) => {
      await createShare({ resourceType, resourceId, resourceTitle, recipientEmail });
      // Reload to get the server-authoritative list (includes shareId and createdAt).
      await load();
    },
    [resourceType, resourceId, resourceTitle, load],
  );

  const removeShare = useCallback(async (shareId: string) => {
    await revokeShare(shareId);
    setState((s) => ({
      ...s,
      recipients: s.recipients.filter((r) => r.shareId !== shareId),
    }));
  }, []);

  // Auto-load when the resource changes (skip if no resourceId to avoid spurious calls).
  useEffect(() => {
    if (resourceId && ownerId) {
      void load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, ownerId]);

  return { ...state, load, addShare, removeShare };
}
