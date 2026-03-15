import { useState, useRef } from "react";
import type { ImportedFile, FileStatus } from "@/types/experiment";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function deriveFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  return ext ?? "FILE";
}

/** File extensions the browser can decode as plain UTF-8 text */
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "json", "xml", "html", "htm",
  "tex", "rst", "log", "tsv",
]);

function isTextFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext);
}

export interface UseReferencesResult {
  files: ImportedFile[];
  /** Add files selected from a native file picker */
  addFiles: (selected: FileList) => void;
  removeFile: (id: string) => void;
  /** Simulate analysis progress: pending → analyzing → done */
  analyze: () => void;
  /** True when pending files exist and nothing is currently analyzing */
  canAnalyze: boolean;
  /** True when at least one file is currently analyzing */
  isAnalyzing: boolean;
  /** True when at least one file exists and all are done */
  analysisComplete: boolean;
  /**
   * Read all uploaded files as plain text and concatenate.
   * Text files (.txt, .md, .csv …): content is read and included.
   * Binary files (PDF, DOCX …): only the filename is included as a hint.
   * Call this just before sending to the AI extraction endpoint.
   */
  readFilesAsText: () => Promise<string>;
}

const ANALYZE_BASE_DELAY_MS = 1400;
const ANALYZE_STAGGER_MS = 700;

export function useReferences(initial: ImportedFile[]): UseReferencesResult {
  const [files, setFiles] = useState<ImportedFile[]>(initial);

  /** Raw File objects stored by id — kept separate to avoid polluting ImportedFile type */
  const rawFilesRef = useRef<Map<string, File>>(new Map());

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const analyzingCount = files.filter((f) => f.status === "analyzing").length;
  const canAnalyze = pendingCount > 0 && analyzingCount === 0;
  const isAnalyzing = analyzingCount > 0;
  const analysisComplete =
    files.length > 0 && files.every((f) => f.status === "done");

  function addFiles(selected: FileList) {
    const now = new Date();
    const incoming: ImportedFile[] = [];

    Array.from(selected).forEach((f) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      rawFilesRef.current.set(id, f);
      incoming.push({
        id,
        name: f.name,
        fileType: deriveFileType(f.name),
        size: formatSize(f.size),
        importedAt: formatTime(now),
        status: "pending" as FileStatus,
      });
    });

    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(id: string) {
    rawFilesRef.current.delete(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function analyze() {
    const pendingIds = files
      .filter((f) => f.status === "pending")
      .map((f) => f.id);

    if (pendingIds.length === 0) return;

    setFiles((prev) =>
      prev.map((f) =>
        pendingIds.includes(f.id) ? { ...f, status: "analyzing" } : f,
      ),
    );

    pendingIds.forEach((id, index) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "done" } : f,
          ),
        );
      }, ANALYZE_BASE_DELAY_MS + index * ANALYZE_STAGGER_MS);
    });
  }

  async function readFilesAsText(): Promise<string> {
    const parts: string[] = [];

    for (const meta of files) {
      const raw = rawFilesRef.current.get(meta.id);
      if (!raw) continue;

      if (isTextFile(meta.name)) {
        try {
          const text = await raw.text();
          if (text.trim()) {
            parts.push(`[文件: ${meta.name}]\n${text.trim()}`);
          }
        } catch {
          parts.push(`[文件: ${meta.name}（文本读取失败）]`);
        }
      } else {
        // Binary files: contribute filename as a topic hint for the LLM
        parts.push(`[文件: ${meta.name}（${meta.fileType} 格式，内容未解析，仅供参考）]`);
      }
    }

    return parts.join("\n\n");
  }

  return {
    files,
    addFiles,
    removeFile,
    analyze,
    canAnalyze,
    isAnalyzing,
    analysisComplete,
    readFilesAsText,
  };
}
