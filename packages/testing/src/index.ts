import type { ActorContext, Permission, Role } from '@athar/auth';

export const DEMO_TENANT_A = '00000000-0000-4000-8000-000000000001';
export const DEMO_TENANT_B = '00000000-0000-4000-8000-000000000002';

export function makeActor(
  actorId: string,
  role: Role,
  tenantId = DEMO_TENANT_A,
  options: { unitIds?: readonly string[] | '*'; denies?: readonly Permission[]; modules?: string[] } = {},
): ActorContext {
  return {
    actorId,
    memberships: [
      {
        tenantId,
        role,
        unitIds: options.unitIds ?? '*',
        entitlements: options.modules ?? ['core'],
        ...(options.denies ? { denies: options.denies } : {}),
      },
    ],
  };
}

export const fixtures = {
  founderA: makeActor('00000000-0000-4000-8000-000000000101', 'founder'),
  unitManagerA: makeActor('00000000-0000-4000-8000-000000000102', 'unit_manager', DEMO_TENANT_A, { unitIds: ['digital'] }),
  financeA: makeActor('00000000-0000-4000-8000-000000000103', 'finance_admin'),
  memberA: makeActor('00000000-0000-4000-8000-000000000104', 'member', DEMO_TENANT_A, { unitIds: ['digital'] }),
  contractorA: makeActor('00000000-0000-4000-8000-000000000105', 'contractor', DEMO_TENANT_A, { unitIds: ['studio'] }),
  clientA: makeActor('00000000-0000-4000-8000-000000000106', 'client'),
  founderB: makeActor('00000000-0000-4000-8000-000000000201', 'founder', DEMO_TENANT_B),
} as const;
