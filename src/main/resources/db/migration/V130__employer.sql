-- Feature M1-3 · Employer profile and verification (Member-3's feature, built into this repo)
-- One business profile per employer account. The employer fills in the details and uploads a trade licence or
-- national ID; an admin approves or rejects it. Approved employers get the "Verified" badge on their job posts.
--   * latitude/longitude: the optional map pin (Member-1's distance search can add a PostGIS point from them)
--   * contact_phone/contact_email: shown to admins only, never on job posts
--   * document_key: the uploaded file in the FileStore (kaaj.files.dir); never a path, never shown to the employer
--   * the CHECKs at the end keep the verification rules true even for SQL written by hand
CREATE TABLE employer (
  id                   uuid PRIMARY KEY DEFAULT uuidv7(),
  owner_id             uuid NOT NULL UNIQUE REFERENCES app_user (id),
  name                 text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  kind                 text NOT NULL CHECK (kind IN ('HOUSEHOLD', 'SME', 'COMPANY', 'AGENCY', 'NGO')),
  address              text,
  latitude             double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude            double precision CHECK (longitude BETWEEN -180 AND 180),
  contact_person       text,
  contact_phone        text,
  contact_email        text,
  document_key         text,
  document_name        text,
  document_type        text CHECK (document_type IN ('TRADE_LICENCE', 'NATIONAL_ID')),
  verification_status  text NOT NULL DEFAULT 'UNVERIFIED'
                       CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  verification_note    text,                    -- the rejection reason, or the admin's note on approval
  submitted_at         timestamptz,             -- last time the profile was sent for review
  verified_by          uuid REFERENCES app_user (id),
  verified_at          timestamptz,
  trust_score          real NOT NULL DEFAULT 0.5,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (verification_status = 'UNVERIFIED' OR submitted_at IS NOT NULL),
  CHECK (verification_status <> 'PENDING' OR document_key IS NOT NULL),
  CHECK (verification_status <> 'REJECTED' OR verification_note IS NOT NULL),
  CHECK (verification_status <> 'VERIFIED' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

-- The admin verification queue: one status, oldest submission first
CREATE INDEX employer_queue_idx ON employer (verification_status, submitted_at, id);
