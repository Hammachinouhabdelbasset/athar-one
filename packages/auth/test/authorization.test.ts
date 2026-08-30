import { describe, expect, it } from 'vitest';
import { authorize, maskFields, type ActorContext } from '../src/index.js';

const founderA: ActorContext = {
  actorId: 'founder-a',
  memberships: [
    { tenantId: 'tenant-a', role: 'founder', unitIds: '*', entitlements: ['core'] },
  ],
};

const unitManager: ActorContext = {
  actorId: 'manager-a',
  memberships: [
    {
      tenantId: 'tenant-a',
      role: 'unit_manager',
      unitIds: ['digital'],
      entitlements: ['core'],
    },
  ],
};

describe('authorize', () => {
  it('blocks cross-tenant access even when a guessed tenant id is supplied', () => {
    expect(
      authorize({
        actor: founderA,
        tenantId: 'tenant-a',
        resourceTenantId: 'tenant-b',
        permission: 'tenant.settings.read',
      }),
    ).toEqual({ allowed: false, reason: 'tenant_isolation' });
  });

  it('blocks a disabled module even for a founder', () => {
    expect(
      authorize({
        actor: founderA,
        tenantId: 'tenant-a',
        resourceTenantId: 'tenant-a',
        permission: 'work.read',
        module: 'agency',
      }),
    ).toEqual({ allowed: false, reason: 'module_disabled' });
  });

  it('enforces business-unit scope', () => {
    expect(
      authorize({
        actor: unitManager,
        tenantId: 'tenant-a',
        resourceTenantId: 'tenant-a',
        unitId: 'studio',
        permission: 'work.read',
      }),
    ).toEqual({ allowed: false, reason: 'unit_scope' });
  });

  it('allows an authorized in-scope action', () => {
    expect(
      authorize({
        actor: unitManager,
        tenantId: 'tenant-a',
        resourceTenantId: 'tenant-a',
        unitId: 'digital',
        permission: 'work.read',
      }).allowed,
    ).toBe(true);
  });
});

describe('maskFields', () => {
  it('uses an explicit safe-field serializer for clients', () => {
    const result = maskFields('client', {
      id: 'project-1',
      name: 'Launch',
      status: 'active',
      safeSummary: 'On track',
      internalMargin: 42,
      updatedAt: '2026-08-30T00:00:00Z',
    });
    expect(result).not.toHaveProperty('internalMargin');
    expect(result).toHaveProperty('safeSummary', 'On track');
  });
});
