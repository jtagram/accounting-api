import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { EnvModule } from './common/config/env.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { JwtPublicKeyModule } from './common/jwt/jwt-public-key.module.js';
import { LoggerModule } from './common/logger/logger.module.js';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    JwtPublicKeyModule,
    HealthModule,
    ContabilidadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
