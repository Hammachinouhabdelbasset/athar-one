import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { UpdateTenantSettings } from '@athar/contracts';
import { Actor, RequestContextGuard, type RequestActor } from '../platform/request-context.js';
import { TenantSettingsService } from './tenant-settings.service.js';

@Controller('v1/tenants/:tenantId/settings')
@UseGuards(RequestContextGuard)
export class TenantSettingsController {
  constructor(private readonly settings: TenantSettingsService) {}

  @Get()
  get(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Actor() actor: RequestActor,
  ) {
    return this.settings.get(tenantId, actor);
  }

  @Put()
  update(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() body: UpdateTenantSettings,
    @Headers('if-match') ifMatch: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Actor() actor: RequestActor,
  ) {
    const expectedVersion = Number(ifMatch);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new Error('A positive If-Match version is required.');
    }
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new Error('A valid Idempotency-Key is required.');
    }
    return this.settings.update(tenantId, body, expectedVersion, idempotencyKey, actor);
  }
}
