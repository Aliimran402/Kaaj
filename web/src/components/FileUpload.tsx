import { Camera, CircleCheck, CloudUpload, FileText } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { checkFile, DOCUMENT_MAX_MB, DOCUMENT_MEDIA_TYPES, type FileProblem } from '../lib/files';
import { Button, FieldMessage } from './ui';

type FileUploadProps = {
  title: string;
  hint: string;
  /** The name of the file uploaded before, if any. */
  uploadedName?: string | null;
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
};

/** Choose a file or take a photo. The type and size are checked here first, then the server checks them again. */
export function FileUpload({ title, hint, uploadedName, disabled = false, busy = false, onFile }: FileUploadProps) {
  const { t } = useTranslation();
  const picker = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<FileProblem | null>(null);

  function handle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again still counts
    if (!file) return;
    const found = checkFile(file);
    setProblem(found);
    if (!found) onFile(file);
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand/25 bg-brand-soft/50 p-5 text-center">
      <CloudUpload aria-hidden className="mx-auto size-8 text-brand" />
      <p className="mt-2 font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button loading={busy} disabled={disabled} onClick={() => picker.current?.click()}>
          {!busy && <FileText aria-hidden className="size-4" />}
          {busy ? t('upload.uploading') : t('upload.choose')}
        </Button>
        <Button variant="secondary" disabled={disabled || busy} onClick={() => camera.current?.click()}>
          <Camera aria-hidden className="size-4" />
          {t('upload.camera')}
        </Button>
      </div>
      <input
        ref={picker}
        type="file"
        accept={DOCUMENT_MEDIA_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        data-testid="file-input"
        onChange={handle}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={handle}
      />
      {uploadedName && !problem && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium break-all text-success">
          <CircleCheck aria-hidden className="size-4 shrink-0" />
          {t('upload.uploaded')}: {uploadedName}
        </p>
      )}
      {problem && (
        <div role="alert" className="mt-2 flex justify-center">
          <FieldMessage>{t(problem, { mb: DOCUMENT_MAX_MB })}</FieldMessage>
        </div>
      )}
    </div>
  );
}
