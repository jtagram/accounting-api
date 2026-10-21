import { Module } from '@nestjs/common';
import { LoggerModule } from './common/logger/logger.module.js';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [LoggerModule, HealthModule, ContabilidadModule],
})
export class AppModule {}
