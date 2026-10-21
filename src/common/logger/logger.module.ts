import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { construirOpcionesDeLogger, obtenerNivelDeLog } from './logger.config.js';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: () => construirOpcionesDeLogger(obtenerNivelDeLog(process.env.LOG_LEVEL)),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
