import { Controller, Get, Module } from '@nestjs/common';
import { createDatabase } from '@athar/db';
import { RequestContextGuard } from './platform/request-context.js';
import { TenantSettingsController } from './tenancy/tenant-settings.controller.js';
import { ATHAR_DATABASE, TenantSettingsService } from './tenancy/tenant-settings.service.js';

@Controller('health')
class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', service: 'athar-api', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    return { status: 'ok', checks: { process: 'up', database: 'configured' } };
  }
}

@Module({
  controllers: [HealthController, TenantSettingsController],
  providers: [
    RequestContextGuard,
    TenantSettingsService,
    {
      provide: ATHAR_DATABASE,
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) throw new Error('DATABASE_URL is required.');
        return createDatabase(databaseUrl);
      },
    },
  ],
})
export class AppModule {}
