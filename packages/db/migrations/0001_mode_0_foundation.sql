BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS athar;

CREATE TABLE athar.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  external_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en' CHECK (default_locale IN ('en','fr-FR','ar-DZ')),
  timezone text NOT NULL DEFAULT 'UTC',
  is_test_data boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE athar.legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  group_id uuid REFERENCES athar.groups(id),
  name text NOT NULL,
  country_code char(2) NOT NULL,
  registration_number text,
  version integer NOT NULL DEFAULT 1,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  legal_entity_id uuid NOT NULL REFERENCES athar.legal_entities(id),
  code text NOT NULL,
  name text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en',
  version integer NOT NULL DEFAULT 1,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE athar.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  business_unit_id uuid NOT NULL REFERENCES athar.business_units(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  department_id uuid NOT NULL REFERENCES athar.departments(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  business_unit_id uuid REFERENCES athar.business_units(id),
  name text NOT NULL,
  timezone text NOT NULL,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  user_id uuid NOT NULL REFERENCES athar.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE athar.role_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  membership_id uuid NOT NULL REFERENCES athar.memberships(id),
  role_key text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('tenant','legal_entity','business_unit','department','team','self','client_account')),
  scope_id uuid,
  denies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_key)
);

CREATE TABLE athar.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES athar.tenants(id),
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','fr-FR','ar-DZ')),
  timezone text NOT NULL DEFAULT 'UTC',
  week_starts_on integer NOT NULL DEFAULT 0 CHECK (week_starts_on BETWEEN 0 AND 6),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  user_id uuid NOT NULL REFERENCES athar.users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  role_key text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  invited_by uuid NOT NULL REFERENCES athar.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE athar.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  command_name text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  response jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, command_name, idempotency_key)
);

CREATE TABLE athar.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  event_name text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid,
  schema_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  correlation_id text NOT NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_pending_idx ON athar.outbox (available_at) WHERE processed_at IS NULL;

CREATE TABLE athar.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES athar.tenants(id),
  actor_id uuid REFERENCES athar.users(id),
  event_name text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text NOT NULL,
  correlation_id text NOT NULL,
  before_meta jsonb,
  after_meta jsonb,
  source text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_tenant_time_idx ON athar.audit_log (tenant_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION athar.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION athar.prevent_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON athar.audit_log
FOR EACH ROW EXECUTE FUNCTION athar.prevent_audit_mutation();

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'groups','legal_entities','business_units','departments','teams','locations',
    'memberships','role_bindings','entitlements','tenant_settings','sessions',
    'invitations','idempotency_keys','outbox','audit_log'
  ] LOOP
    EXECUTE format('ALTER TABLE athar.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE athar.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON athar.%I USING (tenant_id = athar.current_tenant_id()) WITH CHECK (tenant_id = athar.current_tenant_id())',
      table_name
    );
  END LOOP;
END $$;

COMMIT;
