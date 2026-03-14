/**
 * AttrPill — 只读属性标签 pill（key: value 格式）
 *
 * 用于：PaperViewCard、ReportCard 等只读属性展示
 *
 * Layer: shared UI component
 */

export interface AttrPillProps {
  label: string;
  value: string | number | null | undefined;
}

export function AttrPill({ label, value }: AttrPillProps) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <span className="inline-flex items-center bg-slate-100 rounded-full px-2.5 py-0.5">
      <span className="text-xs text-slate-600">
        {label}: {value}
      </span>
    </span>
  );
}
