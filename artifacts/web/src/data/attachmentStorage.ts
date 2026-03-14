/**
 * attachmentStorage — per-attachment data URL persistence.
 *
 * Problem solved:
 *   Workbench records are saved to sessionStorage as a JSON blob.
 *   Base64 data URLs for images/PDFs can be several MB each.
 *   When embedded inside the records JSON the combined size can exceed the
 *   sessionStorage quota (~5 MB); the setItem call throws, is silently caught,
 *   and the entire save is lost — so attachments uploaded AFTER the last
 *   successful save disappear on page refresh.
 *
 * Solution:
 *   Strip data URLs from the records JSON before saving (keeps the JSON small).
 *   Save each data URL under its own sessionStorage key: "sciblock:att:{id}".
 *   Restore data URLs from those separate keys after loading.
 *   If a single large attachment fails to save it does NOT affect the others.
 */

const ATT_PREFIX = "sciblock:att:";

/** Save one attachment's data URL under its own sessionStorage key.
 *  Returns false if the save fails (quota exceeded — file too large). */
export function saveAttBlob(id: string, dataUrl: string): boolean {
  try {
    sessionStorage.setItem(ATT_PREFIX + id, dataUrl);
    return true;
  } catch {
    return false;
  }
}

/** Load a saved attachment data URL by ID. Returns null when not found. */
export function loadAttBlob(id: string): string | null {
  try {
    return sessionStorage.getItem(ATT_PREFIX + id);
  } catch {
    return null;
  }
}

/** Remove a saved attachment data URL (call when the attachment is deleted). */
export function deleteAttBlob(id: string): void {
  try { sessionStorage.removeItem(ATT_PREFIX + id); } catch {}
}
