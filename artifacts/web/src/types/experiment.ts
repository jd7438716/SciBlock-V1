export interface WizardStep {
  id: number;
  label: string;
}

export interface ImportedFile {
  id: string;
  name: string;
  fileType: string; // e.g. "PDF", "DOCX"
  size: string;     // human-readable, e.g. "2.4 MB"
}
