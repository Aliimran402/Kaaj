import type { Me } from '../auth/api';
import type { AdminEmployer, EmployerProfile } from './types';

// Test data for the employer profile and verification tests (made-up people and businesses).

export const employerUser: Me = {
  id: '0193c8b4-2c3d-7e4f-9a0b-1c2d3e4f5a01',
  email: 'karim@example.com',
  role: 'EMPLOYER',
  locale: 'bn',
  status: 'ACTIVE',
};

export const adminUser: Me = { ...employerUser, id: '0193c8b4-2c3d-7e4f-9a0b-1c2d3e4f5a02', email: 'admin@example.com', role: 'ADMIN' };

export const unverifiedProfile: EmployerProfile = {
  id: '0193c8b4-2c3d-7e4f-9a0b-1c2d3e4f5e01',
  name: 'Karim Transport',
  kind: 'SME',
  address: 'Station Road, Tongi',
  latitude: null,
  longitude: null,
  contactPerson: 'Md. Karim',
  contactPhone: '01712345678',
  contactEmail: null,
  hasDocument: false,
  documentName: null,
  documentType: null,
  status: 'UNVERIFIED',
  verificationNote: null,
  submittedAt: null,
  verifiedAt: null,
  createdAt: '2026-11-27T09:00:00Z',
  verified: false,
  missing: ['document'],
};

export const pendingProfile: EmployerProfile = {
  ...unverifiedProfile,
  hasDocument: true,
  documentName: 'licence.pdf',
  documentType: 'TRADE_LICENCE',
  status: 'PENDING',
  submittedAt: '2026-11-27T10:00:00Z',
  missing: [],
};

export const pendingEmployer: AdminEmployer = {
  id: unverifiedProfile.id,
  name: 'Karim Transport',
  kind: 'SME',
  address: 'Station Road, Tongi',
  latitude: 23.8916,
  longitude: 90.4023,
  contactPerson: 'Md. Karim',
  contactPhone: '01712345678',
  contactEmail: null,
  ownerEmail: 'karim@example.com',
  documentName: 'licence.png',
  documentType: 'TRADE_LICENCE',
  documentUrl: `/api/v1/admin/employers/${unverifiedProfile.id}/document`,
  documentIsPdf: false,
  status: 'PENDING',
  verificationNote: null,
  submittedAt: '2026-11-27T10:00:00Z',
  verifiedAt: null,
  createdAt: '2026-11-27T09:00:00Z',
};
