/**
 * useDateTime — 实时时钟业务逻辑层
 *
 * Layer: hook (pure state management, no UI dependency)
 *
 * 职责:
 *   - 维护当前时间 Date 对象，每 intervalMs 毫秒更新一次
 *   - 提供格式化后的日期字符串和时间字符串
 *   - 维护 hour12 偏好（持久化到 localStorage）
 *   - 在组件卸载时清理定时器，避免内存泄漏
 *
 * 扩展方式:
 *   - 时区支持: 在 formatTime() 中传入 timeZone 选项
 *   - 更多格式: 在 UseDateTimeReturn 中增加字段并在 formatDate/formatTime 中处理
 */

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sciblock:prefs:hour12";
const DEFAULT_HOUR12 = false;

// ---------------------------------------------------------------------------
// Formatters  (pure functions, testable independently)
// ---------------------------------------------------------------------------

/** Returns zero-padded two-digit string */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format date → "YYYY-MM-DD" */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Format time → "HH:mm:ss" (24h) or "hh:mm:ss AM/PM" (12h) */
export function formatTime(date: Date, hour12: boolean): string {
  if (!hour12) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  const h = date.getHours();
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${period}`;
}

// ---------------------------------------------------------------------------
// Config & return types
// ---------------------------------------------------------------------------

export interface UseDateTimeConfig {
  /** Timer resolution in ms. Default: 1000. */
  intervalMs?: number;
}

export interface UseDateTimeReturn {
  /** Formatted date: "YYYY-MM-DD" */
  dateStr: string;
  /** Formatted time: "HH:mm:ss" or "hh:mm:ss AM/PM" */
  timeStr: string;
  /** Raw Date for consumers that need custom formatting */
  now: Date;
  /** Whether 12-hour mode is active */
  hour12: boolean;
  /** Toggle between 24h and 12h; persists to localStorage */
  toggleHour12: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDateTime(config: UseDateTimeConfig = {}): UseDateTimeReturn {
  const { intervalMs = 1000 } = config;

  const [now, setNow] = useState<Date>(() => new Date());

  const [hour12, setHour12] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : DEFAULT_HOUR12;
    } catch {
      return DEFAULT_HOUR12;
    }
  });

  // Tick every intervalMs
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const toggleHour12 = useCallback(() => {
    setHour12((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    now,
    dateStr: formatDate(now),
    timeStr: formatTime(now, hour12),
    hour12,
    toggleHour12,
  };
}
