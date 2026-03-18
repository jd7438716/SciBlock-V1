import React, { useState, useRef } from "react";
import { Sparkles, X, Share2, CheckCheck, Loader2 } from "lucide-react";
import { useWorkbench } from "@/contexts/WorkbenchContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAiTitleAssist } from "@/hooks/useAiTitleAssist";
import { useShares } from "@/hooks/useShares";
import { useToast } from "@/hooks/use-toast";
import { ExperimentTitleAssist } from "./ExperimentTitleAssist";
import { StatusPicker } from "./StatusPicker";
import {
  InheritanceBanner,
  DirtyWarningBanner,
  ConfirmationStateBadge,
} from "./InheritanceBanner";
import { SharedWithAvatars } from "@/components/share/SharedWithAvatars";
import { ShareModal } from "@/components/share/ShareModal";

/**
 * ExperimentHeader — top section of the OntologyPanel.
 *
 * Layout:
 *   Row 0: InheritanceBanner   (lineage info — shown when applicable)
 *   Row 0b: DirtyWarningBanner (shown when confirmationState === "confirmed_dirty")
 *   Row 1: Title + [AI icon] + [分享 button]
 *   Row 2: Status badge + experiment code + [序号 badge] + [确认状态 badge]
 *   Row 3: Tags
 *   Row 4: [确认保存 button] (always shown for persisted records)
 *
 * State machine (confirmationState) is owned by WorkbenchContext.
 * This component reads state + dispatches actions; no local business logic.
 */
export function ExperimentHeader() {
  const {
    currentRecord,
    isCurrentRecordHead,
    updateTitle,
    updateStatus,
    updateExperimentCode,
    addTag,
    removeTag,
    confirmRecord,
  } = useWorkbench();

  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const assist = useAiTitleAssist();
  const [isConfirming, setIsConfirming] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const isPersisted = currentRecord.id.includes("-") && !currentRecord.id.startsWith("rec_");
  const canShare = isPersisted && !!currentUser;

  const shares = useShares(
    canShare
      ? {
          resourceType: "experiment_record",
          resourceId: currentRecord.id,
          resourceTitle: currentRecord.title,
          ownerId: currentUser!.id,
        }
      : {
          resourceType: "experiment_record",
          resourceId: "",
          resourceTitle: "",
          ownerId: "",
        }
  );

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
    if (e.key === "Backspace" && tagInput === "" && currentRecord.tags.length > 0) {
      removeTag(currentRecord.tags[currentRecord.tags.length - 1]);
    }
    if (e.key === "Escape") {
      setTagInput("");
      setIsAddingTag(false);
      tagInputRef.current?.blur();
    }
  }

  function openTagInput() {
    setIsAddingTag(true);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }

  function handleTagInputBlur() {
    if (tagInput === "") setIsAddingTag(false);
  }

  async function handleConfirm() {
    if (isConfirming) return;
    // Capture head status before the API call — isCurrentRecordHead will
    // re-compute after records update, but we need the pre-call value for
    // the toast message.
    const wasHead = isCurrentRecordHead;
    setIsConfirming(true);
    try {
      await confirmRecord();
      if (wasHead) {
        toast({
          title: "传承链已更新",
          description: "后续实验将继承新的参数。",
        });
      } else {
        toast({
          title: "记录已更新",
          description: "传承链不受影响。",
        });
      }
    } finally {
      setIsConfirming(false);
    }
  }

  // Derived UI state from the authoritative confirmationState value.
  const isDirty = currentRecord.confirmationState === "confirmed_dirty";
  const isConfirmed = currentRecord.confirmationState === "confirmed";
  const isInConfirmedState = isConfirmed || isDirty;

  const confirmButtonLabel = (() => {
    if (isConfirming) return "确认中…";
    if (isConfirmed) return "已确认保存";
    if (isDirty) return "重新确认";
    return "确认保存";
  })();

  // Tooltip clarifies chain impact only for confirmed/confirmed_dirty records.
  const confirmButtonTooltip = (() => {
    if (!isInConfirmedState) return "确认保存，固定本条记录的实验内容";
    if (isCurrentRecordHead)
      return "确认后，后续新建实验记录将以此为默认参数";
    return "仅更新此条记录的确认内容，不影响当前传承链";
  })();

  // Confirmed (clean) → disable; dirty or draft → enabled.
  const confirmButtonDisabled = isConfirming || isConfirmed;

  return (
    <div className="flex flex-col border-b border-gray-100 bg-white flex-shrink-0">

      {/* Row 0: Lineage banner */}
      <InheritanceBanner record={currentRecord} />

      {/* Row 0b: Dirty warning — shown prominently when the user has edited a
          confirmed record and hasn't re-confirmed yet. Provides one-click
          shortcut to re-confirm without scrolling to the button below. */}
      {isPersisted && isDirty && (
        <DirtyWarningBanner isConfirming={isConfirming} onConfirm={handleConfirm} />
      )}

      <div className="flex flex-col gap-3 px-4 py-3">

        {/* Row 1: Title + AI toggle + Share button */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentRecord.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="实验标题（手写或 AI 生成）"
              className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-gray-200 focus:border-gray-500 pb-0.5 placeholder-gray-300 transition-colors"
            />

            <button
              title="AI 辅助生成标题"
              onClick={() => assist.setAiAssistOpen(!assist.aiAssistOpen)}
              className={[
                "flex-shrink-0 p-1 rounded transition-colors",
                assist.aiAssistOpen
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:text-gray-700",
              ].join(" ")}
            >
              <Sparkles size={13} />
            </button>

            {canShare && (
              <button
                type="button"
                title="分享此实验记录"
                onClick={() => setShareOpen(true)}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Share2 size={12} />
                <span>分享</span>
                {shares.recipients.length > 0 && (
                  <span className="bg-indigo-200 text-indigo-700 rounded-full px-1 text-[10px] font-bold leading-4">
                    {shares.recipients.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <ExperimentTitleAssist {...assist} />
        </div>

        {/* Row 2: Status + code + seq + confirmation badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPicker
            value={currentRecord.experimentStatus}
            onChange={updateStatus}
          />

          <input
            type="text"
            value={currentRecord.experimentCode}
            onChange={(e) => updateExperimentCode(e.target.value)}
            placeholder="实验编号"
            className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none focus:border-gray-400 w-24 font-mono"
          />

          {isPersisted && currentRecord.sequenceNumber > 0 && (
            <span className="text-[11px] text-gray-400 font-mono">
              #{currentRecord.sequenceNumber}
            </span>
          )}

          {/* Chain-position badge: visible only for confirmed/confirmed_dirty records */}
          {isPersisted && isInConfirmedState && (
            isCurrentRecordHead ? (
              <span
                title="此记录是当前传承链的起点，再次确认将更新后续记录的默认参数"
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 cursor-default"
              >
                当前传承起点
              </span>
            ) : (
              <span
                title="此记录已从传承链中被更新的版本取代，再次确认不影响传承链"
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 cursor-default"
              >
                历史记录
              </span>
            )
          )}

          {isPersisted && <ConfirmationStateBadge record={currentRecord} />}

          {canShare && shares.recipients.length > 0 && (
            <SharedWithAvatars recipients={shares.recipients} />
          )}
        </div>

        {/* Row 3: Tags */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
          {currentRecord.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5"
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}

          {isAddingTag && (
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleTagInputBlur}
              placeholder="输入标签，Enter 确认"
              className="text-xs outline-none bg-transparent text-gray-600 placeholder-gray-300 min-w-[110px]"
            />
          )}

          {!isAddingTag && (
            <button
              onClick={openTagInput}
              className="inline-flex items-center gap-0.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-full px-2 py-0.5 hover:border-gray-400 hover:text-gray-500 transition-colors"
            >
              <span className="text-[11px] leading-none">＋</span>
              添加标签
            </button>
          )}
        </div>

        {/* Row 4: Confirm-save button
            - draft         → dark / primary style
            - confirmed     → muted green / disabled
            - confirmed_dirty → amber + pulse-ring to draw immediate attention */}
        {isPersisted && (
          <div className="flex items-center">
            <div className={isDirty ? "relative" : ""}>
              {/* Pulse ring — only rendered for the dirty state */}
              {isDirty && !isConfirming && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-md bg-amber-400 opacity-30 animate-ping"
                />
              )}
              <button
                type="button"
                title={confirmButtonTooltip}
                onClick={handleConfirm}
                disabled={confirmButtonDisabled}
                className={[
                  "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isConfirmed
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                    : isDirty
                    ? "bg-amber-500 text-white border border-amber-600 hover:bg-amber-600 shadow-sm"
                    : "bg-gray-900 text-white hover:bg-gray-700",
                  isConfirming ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {isConfirming ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCheck size={11} />
                )}
                {confirmButtonLabel}
              </button>
            </div>
          </div>
        )}

      </div>

      {shareOpen && (
        <ShareModal
          resourceTitle={currentRecord.title || "此实验记录"}
          recipients={shares.recipients}
          onAdd={shares.addShare}
          onRemove={shares.removeShare}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
