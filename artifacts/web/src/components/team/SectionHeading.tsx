/**
 * SectionHeading — 学生详情页分区标题
 *
 * 样式：小图标 + 小字标题 + 数量徽章 + 横线
 * 用于：MemberDetailPage 各 section 的标题行
 *
 * Layer: shared UI component
 */

import type { ReactNode } from "react";

export interface SectionHeadingProps {
  icon:    ReactNode;
  title:   string;
  count?:  number;
}

export function SectionHeading({ icon, title, count }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs font-semibold text-gray-600 tracking-wide">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}
