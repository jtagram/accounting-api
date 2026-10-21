import { Module } from '@nestjs/common';
import { LoggerModule } from './common/logger/logger.module.js';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module.js';

@Module({
  imports: [LoggerModule, ContabilidadModule],
})
export class AppModule {}
