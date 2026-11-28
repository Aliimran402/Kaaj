import { zodResolver } from '@hookform/resolvers/zod';
import { Building, FileText, Save } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '../../components/FileUpload';
import { MapPicker } from '../../components/MapPicker';
import { Alert, Button, Card, Container, ErrorAlert, PageBanner, SelectField, Spinner, TextField } from '../../components/ui';
import { usePageTitle } from '../../lib/usePageTitle';
import { showServerFieldErrors, useFieldErrorText } from '../auth/formErrors';
import { useEmployerProfile, useResubmit, useSaveProfile, useUploadDocument } from './api';
import { PROFILE_FIELDS, profileSchema, toFormValues, toInput } from './schema';
import { DOCUMENT_TYPES, EMPLOYER_KINDS, type DocumentType, type EmployerProfile } from './types';
import { VerificationPanel } from './VerificationPanel';

/** View: the employer's business profile, the document upload, and the verification status beside them. */
export function EmployerProfilePage() {
  const { t } = useTranslation();
  usePageTitle(t('employerProfile.title'));
  const profile = useEmployerProfile();

  return (
    <>
      <PageBanner title={t('employerProfile.title')} subtitle={t('employerProfile.subtitle')} />
      {profile.isPending ? (
        <Spinner />
      ) : profile.isError ? (
        <Container className="py-8">
          <ErrorAlert error={profile.error} />
        </Container>
      ) : (
        <ProfileScreen profile={profile.data} />
      )}
    </>
  );
}

/** Rendered once the saved profile (or null) has arrived, so the form starts with the saved values. */
function ProfileScreen({ profile }: { profile: EmployerProfile | null }) {
  const { t } = useTranslation();
  const save = useSaveProfile();
  const upload = useUploadDocument();
  const resubmit = useResubmit();
  const fieldError = useFieldErrorText();
  const [documentType, setDocumentType] = useState<DocumentType>(profile?.documentType ?? 'TRADE_LICENCE');
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: toFormValues(profile) });
  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    upload.reset();
    save.mutate(toInput(values), { onError: (error) => showServerFieldErrors(error, setError, PROFILE_FIELDS) });
  });

  function uploadFile(file: File) {
    save.reset();
    upload.mutate({ file, documentType });
  }

  return (
    <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Card>
        <h2 className="flex items-center gap-3 text-lg font-bold text-ink">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
            <Building aria-hidden className="size-5" />
          </span>
          {t('employerProfile.detailsTitle')}
        </h2>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label={t('employerProfile.name')}
              placeholder={t('employerProfile.namePlaceholder')}
              autoComplete="organization"
              error={fieldError(errors.name)}
              {...register('name')}
            />
            <SelectField label={t('employerProfile.kind')} error={fieldError(errors.kind)} {...register('kind')}>
              {EMPLOYER_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`employerProfile.kinds.${kind}`)}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t('employerProfile.address')}
              placeholder={t('employerProfile.addressPlaceholder')}
              autoComplete="street-address"
              error={fieldError(errors.address)}
              {...register('address')}
            />
            <TextField
              label={t('employerProfile.contactPerson')}
              autoComplete="name"
              error={fieldError(errors.contactPerson)}
              {...register('contactPerson')}
            />
            <TextField
              label={t('employerProfile.contactPhone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01712-345678"
              hint={t('employerProfile.contactPhoneHint')}
              error={fieldError(errors.contactPhone)}
              {...register('contactPhone')}
            />
            <TextField
              label={t('employerProfile.contactEmail')}
              optional={t('common.optional')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={fieldError(errors.contactEmail)}
              {...register('contactEmail')}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">
              {t('employerProfile.pin')}
              <span className="ml-1.5 font-normal text-muted">({t('common.optional')})</span>
            </p>
            <MapPicker
              value={latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null}
              onChange={(point) => {
                setValue('latitude', point?.lat ?? null, { shouldDirty: true });
                setValue('longitude', point?.lng ?? null, { shouldDirty: true });
              }}
            />
          </div>

          <ErrorAlert error={save.error} />
          {save.isSuccess && <Alert tone="success">{t('employerProfile.saved')}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" size="lg" className="w-full sm:w-auto" loading={save.isPending}>
              {!save.isPending && <Save aria-hidden className="size-5" />}
              {save.isPending ? t('employerProfile.saving') : t('employerProfile.save')}
            </Button>
          </div>
        </form>

        <section aria-labelledby="document-title" className="mt-8 space-y-4 border-t border-line pt-6">
          <h2 id="document-title" className="flex items-center gap-3 text-lg font-bold text-ink">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
              <FileText aria-hidden className="size-5" />
            </span>
            {t('employerProfile.documentTitle')}
          </h2>
          <SelectField
            label={t('employerProfile.documentType')}
            className="sm:max-w-xs"
            value={documentType}
            disabled={!profile}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`employerProfile.docTypes.${type}`)}
              </option>
            ))}
          </SelectField>
          <FileUpload
            title={t('employerProfile.uploadTitle')}
            hint={t('employerProfile.uploadHint')}
            uploadedName={profile?.documentName}
            disabled={!profile}
            busy={upload.isPending}
            onFile={uploadFile}
          />
          {!profile && <Alert tone="warning">{t('employerProfile.createFirst')}</Alert>}
          <ErrorAlert error={upload.error} />
          {upload.isSuccess && <Alert tone="success">{t('employerProfile.uploadDone')}</Alert>}
          <Alert tone="info">{t('employerProfile.infoPublish')}</Alert>
        </section>
      </Card>

      <div className="space-y-3 lg:sticky lg:top-6">
        <VerificationPanel profile={profile} onResubmit={() => resubmit.mutate()} resubmitting={resubmit.isPending} />
        <ErrorAlert error={resubmit.error} />
      </div>
    </Container>
  );
}
