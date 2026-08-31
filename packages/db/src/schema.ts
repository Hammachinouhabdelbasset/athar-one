import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const athar = pgSchema('athar');

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const users = athar.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  externalId: text('external_id').unique(),
  ...timestamps,
});

export const tenants = athar.table('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  defaultLocale: text('default_locale').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  isTestData: boolean('is_test_data').notNull().default(false),
  version: integer('version').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
});

export const groups = athar.table('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('groups_tenant_name_uq').on(table.tenantId, table.name)]);

export const legalEntities = athar.table('legal_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  groupId: uuid('group_id').references(() => groups.id),
  name: text('name').notNull(),
  countryCode: text('country_code').notNull(),
  registrationNumber: text('registration_number'),
  version: integer('version').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [index('legal_entities_tenant_idx').on(table.tenantId)]);

export const businessUnits = athar.table('business_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => legalEntities.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  defaultLocale: text('default_locale').notNull().default('en'),
  version: integer('version').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex('business_units_tenant_code_uq').on(table.tenantId, table.code)]);

export const departments = athar.table('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
  name: text('name').notNull(),
  ...timestamps,
}, (table) => [index('departments_tenant_unit_idx').on(table.tenantId, table.businessUnitId)]);

export const teams = athar.table('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  name: text('name').notNull(),
  ...timestamps,
}, (table) => [index('teams_tenant_department_idx').on(table.tenantId, table.departmentId)]);

export const locations = athar.table('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  businessUnitId: uuid('business_unit_id').references(() => businessUnits.id),
  name: text('name').notNull(),
  timezone: text('timezone').notNull(),
  address: jsonb('address').$type<Record<string, string>>().notNull().default({}),
  ...timestamps,
}, (table) => [index('locations_tenant_idx').on(table.tenantId)]);

export const memberships = athar.table('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('active'),
  ...timestamps,
}, (table) => [uniqueIndex('memberships_tenant_user_uq').on(table.tenantId, table.userId)]);

export const roleBindings = athar.table('role_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  membershipId: uuid('membership_id').notNull().references(() => memberships.id),
  roleKey: text('role_key').notNull(),
  scopeType: text('scope_type').notNull(),
  scopeId: uuid('scope_id'),
  denies: text('denies').array().notNull().default([]),
  ...timestamps,
}, (table) => [index('role_bindings_tenant_membership_idx').on(table.tenantId, table.membershipId)]);

export const entitlements = athar.table('entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  moduleKey: text('module_key').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  configuration: jsonb('configuration').$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => [uniqueIndex('entitlements_tenant_module_uq').on(table.tenantId, table.moduleKey)]);

export const invitations = athar.table('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  roleKey: text('role_key').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  ...timestamps,
}, (table) => [index('invitations_tenant_email_idx').on(table.tenantId, table.email)]);

export const sessions = athar.table('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  ...timestamps,
}, (table) => [index('sessions_tenant_user_idx').on(table.tenantId, table.userId)]);

export const tenantSettings = athar.table('tenant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id).unique(),
  locale: text('locale').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  weekStartsOn: integer('week_starts_on').notNull().default(0),
  version: integer('version').notNull().default(1),
  ...timestamps,
});

export const idempotencyKeys = athar.table('idempotency_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  commandName: text('command_name').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  requestHash: text('request_hash').notNull(),
  response: jsonb('response'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('idempotency_tenant_command_key_uq').on(table.tenantId, table.commandName, table.idempotencyKey)]);

export const outbox = athar.table('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  eventName: text('event_name').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: uuid('aggregate_id'),
  schemaVersion: integer('schema_version').notNull().default(1),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  correlationId: text('correlation_id').notNull(),
  availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
  attempts: integer('attempts').notNull().default(0),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('outbox_pending_idx').on(table.processedAt, table.availableAt)]);

export const auditLog = athar.table('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  actorId: uuid('actor_id').references(() => users.id),
  eventName: text('event_name').notNull(),
  scope: jsonb('scope').$type<Record<string, string>>().notNull().default({}),
  requestId: text('request_id').notNull(),
  correlationId: text('correlation_id').notNull(),
  beforeMeta: jsonb('before_meta'),
  afterMeta: jsonb('after_meta'),
  source: text('source').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('audit_tenant_occurred_idx').on(table.tenantId, table.occurredAt)]);
