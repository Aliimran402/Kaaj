// Model: what the server's FileStore accepts for a verification document (FileKind.DOCUMENT).
// Checked here too, so people learn at once that a file is wrong instead of after a slow upload.

export const DOCUMENT_MEDIA_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const DOCUMENT_MAX_MB = 3;

export type FileProblem = 'upload.wrongType' | 'upload.tooLarge';

/** An i18n key for what is wrong with the file, or null when it is fine. */
export function checkFile(
  file: { type: string; size: number },
  accept: readonly string[] = DOCUMENT_MEDIA_TYPES,
  maxMb: number = DOCUMENT_MAX_MB,
): FileProblem | null {
  if (!accept.includes(file.type)) return 'upload.wrongType';
  if (file.size > maxMb * 1024 * 1024) return 'upload.tooLarge';
  return null;
}
