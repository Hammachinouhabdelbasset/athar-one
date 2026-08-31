import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { authorize, type ActorContext, type Role } from '@athar/auth';
import {
  auditLog,
  entitlements,
  idempotencyKeys,
  memberships,
  outbox,
  roleBindings,
  tenantSettings,
  tenants,
  type AtharDatabase,
} from '@athar/db';
import { updateTenantSettingsSchema, type TenantSettings, type UpdateTenantSettings } from '@athar/contracts';
import { and, eq } from 'drizzle-orm';
import type { RequestActor } from '../platform/request-context.js';

export const ATHAR_DATABASE = Symbol('ATHAR_DATABASE');

export interface TenantDatabase {
  db: AtharDatabase;
  withTenant<T>(
    tenantId: string,
    actorId: string,
    work: (transaction: AtharDatabase) => Promise<T>,
  ): Promise<T>;
}

@Injectable()
export class TenantSettingsService {
  constructor(@Inject(ATHAR_DATABASE) private readonly database: TenantDatabase) {}

  private async buildActor(
    transaction: AtharDatabase,
    tenantId: string,
    actorId: string,
  ): Promise<ActorContext> {
    const [membership] = await transaction
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenantId),
          eq(memberships.userId, actorId),
          eq(memberships.status, 'active'),
        ),
      )
      .limit(1);

    if (!membership) return { actorId, memberships: [] };

    const bindings = await transaction
      .select({ roleKey: roleBindings.roleKey, denies: roleBindings.denies })
      .from(roleBindings)
      .where(
        and(
          eq(roleBindings.tenantId, tenantId),
          eq(roleBindings.membershipId, membership.id),
          eq(roleBindings.scopeType, 'tenant'),
        ),
      );
    const enabledModules = await transaction
      .select({ moduleKey: entitlements.moduleKey })
      .from(entitlements)
      .where(and(eq(entitlements.tenantId, tenantId), eq(entitlements.enabled, true)));

    const binding = bindings[0];
    if (!binding) return { actorId, memberships: [] };

    return {
      actorId,
      memberships: [
        {
          tenantId,
          role: binding.roleKey as Role,
          unitIds: '*',
          entitlements: enabledModules.map((item) => item.moduleKey),
          denies: binding.denies as never,
        },
      ],
    };
  }

  private assertAllowed(actor: ActorContext, tenantId: string, permission: 'tenant.settings.read' | 'tenant.settings.write'): void {
    const decision = authorize({
      actor,
      tenantId,
      resourceTenantId: tenantId,
      permission,
      module: 'core',
    });
    if (!decision.allowed) throw new ForbiddenException({ code: decision.reason });
  }

  async get(tenantId: string, requestActor: RequestActor): Promise<TenantSettings> {
    return this.database.withTenant(tenantId, requestActor.actorId, async (transaction) => {
      const actor = await this.buildActor(transaction, tenantId, requestActor.actorId);
      this.assertAllowed(actor, tenantId, 'tenant.settings.read');

      const [row] = await transaction
        .select({
          tenantId: tenantSettings.tenantId,
          tenantName: tenants.name,
          locale: tenantSettings.locale,
          timezone: tenantSettings.timezone,
          weekStartsOn: tenantSettings.weekStartsOn,
          version: tenantSettings.version,
          updatedAt: tenantSettings.updatedAt,
        })
        .from(tenantSettings)
        .innerJoin(tenants, eq(tenants.id, tenantSettings.tenantId))
        .where(eq(tenantSettings.tenantId, tenantId))
        .limit(1);

      if (!row) throw new NotFoundException('Tenant settings were not found.');
      return { ...row, locale: row.locale as TenantSettings['locale'], updatedAt: row.updatedAt.toISOString() };
    });
  }

  async update(
    tenantId: string,
    input: UpdateTenantSettings,
    expectedVersion: number,
    idempotencyKey: string,
    requestActor: RequestActor,
  ): Promise<TenantSettings> {
    const command = updateTenantSettingsSchema.parse(input);

    return this.database.withTenant(tenantId, requestActor.actorId, async (transaction) => {
      const actor = await this.buildActor(transaction, tenantId, requestActor.actorId);
      this.assertAllowed(actor, tenantId, 'tenant.settings.write');

      const [existingKey] = await transaction
        .select({ response: idempotencyKeys.response })
        .from(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.tenantId, tenantId),
            eq(idempotencyKeys.commandName, 'tenant.settings.update'),
            eq(idempotencyKeys.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1);
      if (existingKey?.response) return existingKey.response as TenantSettings;

      const [before] = await transaction
        .select()
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantId))
        .limit(1);
      if (!before) throw new NotFoundException('Tenant settings were not found.');
      if (before.version !== expectedVersion) {
        throw new ConflictException({ code: 'VERSION_CONFLICT', currentVersion: before.version });
      }

      const [tenant] = await transaction
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      if (!tenant) throw new NotFoundException('Tenant was not found.');

      const [updated] = await transaction
        .update(tenantSettings)
        .set({
          ...(command.locale ? { locale: command.locale } : {}),
          ...(command.timezone ? { timezone: command.timezone } : {}),
          ...(command.weekStartsOn !== undefined ? { weekStartsOn: command.weekStartsOn } : {}),
          version: before.version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(eq(tenantSettings.tenantId, tenantId), eq(tenantSettings.version, expectedVersion)),
        )
        .returning();
      if (!updated) throw new ConflictException({ code: 'VERSION_CONFLICT' });

      const response: TenantSettings = {
        tenantId,
        tenantName: tenant.name,
        locale: updated.locale as TenantSettings['locale'],
        timezone: updated.timezone,
        weekStartsOn: updated.weekStartsOn,
        version: updated.version,
        updatedAt: updated.updatedAt.toISOString(),
      };

      await transaction.insert(auditLog).values({
        tenantId,
        actorId: requestActor.actorId,
        eventName: 'tenant.settings.updated',
        scope: { tenantId },
        requestId: requestActor.requestId,
        correlationId: requestActor.correlationId,
        beforeMeta: { locale: before.locale, timezone: before.timezone, weekStartsOn: before.weekStartsOn },
        afterMeta: command,
        source: 'api',
      });
      await transaction.insert(outbox).values({
        tenantId,
        eventName: 'tenant.settings.updated',
        aggregateType: 'tenant',
        aggregateId: tenantId,
        payload: { tenantId, version: response.version },
        correlationId: requestActor.correlationId,
      });
      await transaction.insert(idempotencyKeys).values({
        tenantId,
        commandName: 'tenant.settings.update',
        idempotencyKey,
        requestHash: JSON.stringify(command),
        response,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      return response;
    });
  }
}
