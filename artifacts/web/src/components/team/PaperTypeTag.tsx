/**
 * PaperTypeTag — 论文类型标签（学术论文 / 毕业论文）
 *
 * 用于：PaperViewCard、PaperEditForm 标题行
 *
 * Layer: shared UI component
 */

export interface PaperTypeTagProps {
  isThesis: boolean;
}

export function PaperTypeTag({ isThesis }: PaperTypeTagProps) {
  return (
    <span
      className={`flex-shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 leading-none whitespace-nowrap ${
        isThesis
          ? "bg-violet-50 text-violet-600 border-violet-200"
          : "bg-blue-50 text-blue-600 border-blue-200"
      }`}
    >
      {isThesis ? "毕业论文" : "学术论文"}
    </span>
  );
}
