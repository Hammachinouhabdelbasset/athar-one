export const permissions = [
  'tenant.settings.read',
  'tenant.settings.write',
  'unit.manage',
  'finance.read',
  'audit.read',
  'work.read',
  'portal.read',
  'search.use',
  'export.use',
  'file.read',
] as const;

export type Permission = (typeof permissions)[number];
export type Role =
  | 'founder'
  | 'unit_manager'
  | 'finance_admin'
  | 'member'
  | 'contractor'
  | 'client';

export interface Membership {
  tenantId: string;
  role: Role;
  unitIds: readonly string[] | '*';
  entitlements: readonly string[];
  denies?: readonly Permission[];
}

export interface ActorContext {
  actorId: string;
  memberships: readonly Membership[];
}

export interface AuthorizationRequest {
  actor: ActorContext | null;
  tenantId: string;
  resourceTenantId: string;
  permission: Permission;
  module?: string;
  unitId?: string;
}

export type AuthorizationDecision =
  | { allowed: true; membership: Membership }
  | {
      allowed: false;
      reason:
        | 'unauthenticated'
        | 'tenant_isolation'
        | 'explicit_deny'
        | 'module_disabled'
        | 'unit_scope'
        | 'forbidden';
    };

const rolePermissions: Readonly<Record<Role, readonly Permission[]>> = {
  founder: permissions,
  unit_manager: ['tenant.settings.read', 'unit.manage', 'work.read', 'search.use', 'file.read'],
  finance_admin: [
    'tenant.settings.read',
    'finance.read',
    'audit.read',
    'work.read',
    'export.use',
    'file.read',
  ],
  member: ['work.read', 'search.use', 'file.read'],
  contractor: ['work.read', 'file.read'],
  client: ['portal.read', 'file.read'],
};

export function authorize(request: AuthorizationRequest): AuthorizationDecision {
  const { actor, tenantId, resourceTenantId, permission, unitId } = request;
  const module = request.module ?? 'core';

  if (!actor) return { allowed: false, reason: 'unauthenticated' };

  const membership = actor.memberships.find((item) => item.tenantId === tenantId);
  if (!membership || resourceTenantId !== tenantId) {
    return { allowed: false, reason: 'tenant_isolation' };
  }

  if (membership.denies?.includes(permission)) {
    return { allowed: false, reason: 'explicit_deny' };
  }

  if (!membership.entitlements.includes(module)) {
    return { allowed: false, reason: 'module_disabled' };
  }

  if (unitId && membership.unitIds !== '*' && !membership.unitIds.includes(unitId)) {
    return { allowed: false, reason: 'unit_scope' };
  }

  if (!rolePermissions[membership.role].includes(permission)) {
    return { allowed: false, reason: 'forbidden' };
  }

  return { allowed: true, membership };
}

const externalFieldAllowlist: Readonly<Record<'client' | 'contractor', readonly string[]>> = {
  client: ['id', 'name', 'status', 'safeSummary', 'updatedAt'],
  contractor: ['id', 'name', 'status', 'assignedTo', 'dueAt'],
};

export function maskFields<T extends Record<string, unknown>>(
  role: Role,
  record: T,
): Partial<T> {
  if (role !== 'client' && role !== 'contractor') return { ...record };
  const allowed = externalFieldAllowlist[role];
  return Object.fromEntries(Object.entries(record).filter(([key]) => allowed.includes(key))) as Partial<T>;
}
