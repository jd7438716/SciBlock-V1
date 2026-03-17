/**
 * formatRelativeTime — converts an ISO date string into a human-readable
 * relative time label (e.g. "3 天前", "刚刚", "2 个月前").
 *
 * Rules:
 *   < 1 minute  → "刚刚"
 *   < 1 hour    → "N 分钟前"
 *   < 1 day     → "N 小时前"
 *   < 30 days   → "N 天前"
 *   < 12 months → "N 个月前"
 *   ≥ 12 months → "N 年前"
 *
 * Fallback: if the input is null / undefined / unparseable, returns "—".
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "刚刚";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 天前`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} 个月前`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} 年前`;
}
