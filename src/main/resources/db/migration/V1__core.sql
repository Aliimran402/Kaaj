CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE app_user (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  email           text NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  password_hash   text,
  google_sub      text UNIQUE,
  role            text NOT NULL CHECK (role IN ('SEEKER', 'EMPLOYER', 'ADMIN')),
  locale          text NOT NULL DEFAULT 'bn',
  status          text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_code (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  email       text NOT NULL,
  purpose     text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    smallint NOT NULL DEFAULT 0,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON email_code (email, purpose, created_at DESC);

CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    uuid REFERENCES app_user (id),
  action      text NOT NULL,
  target      text NOT NULL,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);