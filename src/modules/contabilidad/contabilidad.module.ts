import { Module } from '@nestjs/common';
import { ContabilidadController } from './contabilidad.controller.js';
import { BuenosAiresService } from './buenos-aires.service.js';
import { BuenosAiresCabaService } from './buenos-aires-caba.service.js';

@Module({
  controllers: [ContabilidadController],
  providers: [BuenosAiresService, BuenosAiresCabaService],
})
export class ContabilidadModule {}
