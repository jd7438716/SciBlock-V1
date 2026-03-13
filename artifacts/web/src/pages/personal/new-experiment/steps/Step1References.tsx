import React from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { PLACEHOLDER_REFERENCES } from "@/data/experimentReferences";
import type { ImportedFile } from "@/types/experiment";

interface Props {
  files: ImportedFile[];
  onRemoveFile: (id: string) => void;
  onAnalyze: () => void;
}

function UploadArea() {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center hover:border-gray-300 transition-colors cursor-pointer bg-gray-50">
      <UploadCloud size={32} className="text-gray-300" />
      <div>
        <p className="text-sm font-medium text-gray-600">拖入文件或点击上传</p>
        <p className="text-xs text-gray-400 mt-0.5">
          支持 PDF、Word、TXT 等格式
        </p>
      </div>
    </div>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: ImportedFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        <FileText size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">
          {file.fileType} · {file.size}
        </p>
      </div>
      <button
        onClick={onRemove}
        aria-label="移除文件"
        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function Step1References({ files, onRemoveFile, onAnalyze }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          创建你的实验基础信息
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          上传实验相关参考资料，系统将帮助你自动提取关键信息
        </p>
      </div>

      <UploadArea />

      {files.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            已导入内容 ({files.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={files.length === 0}
        className={[
          "self-start px-5 py-2 rounded-lg text-sm font-medium transition-colors",
          files.length > 0
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-100 text-gray-400 cursor-not-allowed",
        ].join(" ")}
      >
        开始分析
      </button>
    </div>
  );
}

// Re-export the placeholder data so the page can initialise state from it.
export { PLACEHOLDER_REFERENCES as defaultReferences };
