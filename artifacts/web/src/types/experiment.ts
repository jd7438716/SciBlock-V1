export interface WizardStep {
  id: number;
  label: string;
}

export type FileStatus = "pending" | "analyzing" | "done";

export interface ImportedFile {
  id: string;
  name: string;
  fileType: string;   // e.g. "PDF", "DOCX"
  size: string;       // human-readable
  importedAt: string; // display string, e.g. "14:32"
  status: FileStatus;
}
