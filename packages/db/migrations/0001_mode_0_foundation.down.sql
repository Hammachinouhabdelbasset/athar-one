BEGIN;

DROP TRIGGER IF EXISTS audit_log_immutable ON athar.audit_log;
DROP FUNCTION IF EXISTS athar.prevent_audit_mutation();
DROP FUNCTION IF EXISTS athar.current_tenant_id();
DROP SCHEMA IF EXISTS athar CASCADE;

COMMIT;
