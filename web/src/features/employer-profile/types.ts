// Model: the shapes of the employer module's data, matching the server's view records (EmployerViews.java).

export const EMPLOYER_KINDS = ['HOUSEHOLD', 'SME', 'COMPANY', 'AGENCY', 'NGO'] as const;
export type EmployerKind = (typeof EMPLOYER_KINDS)[number];

export const DOCUMENT_TYPES = ['TRADE_LICENCE', 'NATIONAL_ID'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** The admin queue's tabs: an employer only enters the queue once they have sent a document. */
export const QUEUE_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export type MissingField = 'name' | 'kind' | 'address' | 'contactPerson' | 'contactPhone' | 'document';

/** EmployerViews.ProfileView: the employer's own profile (GET/PUT /api/v1/employer/profile). */
export type EmployerProfile = {
  id: string;
  name: string;
  kind: EmployerKind;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  hasDocument: boolean;
  documentName: string | null;
  documentType: DocumentType | null;
  status: VerificationStatus;
  verificationNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  /** true shows the "Verified" badge on the employer's job posts. */
  verified: boolean;
  missing: MissingField[];
};

/** EmployerProfileController.ProfileRequest */
export type EmployerProfileInput = {
  name: string;
  kind: EmployerKind;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string | null;
};

/** EmployerViews.AdminEmployerView: one employer in the admin's verification queue. */
export type AdminEmployer = {
  id: string;
  name: string;
  kind: EmployerKind;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  ownerEmail: string | null;
  documentName: string | null;
  documentType: DocumentType | null;
  /** Admins only: /api/v1/admin/employers/{id}/document */
  documentUrl: string | null;
  /** From the stored file's real type: show it in a frame (PDF) or as an image. */
  documentIsPdf: boolean;
  status: VerificationStatus;
  verificationNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

/** shared/CursorPage.java: nextCursor is null on the last page. */
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

export type Decision = 'APPROVE' | 'REJECT';
