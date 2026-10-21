import { copyFile, mkdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { obtenerCarpetaDestino } from './carpeta-destino.js';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

@Injectable()
export class GuardarPdf {
  constructor(private readonly logger: Logger) {}

  async guardarPdf(ruta: string, nombrePersona: string): Promise<void> {
    try {
      const carpetaDestino = obtenerCarpetaDestino(nombrePersona);

      await mkdir(carpetaDestino, { recursive: true });

      const nombreArchivo = basename(ruta);

      await copyFile(ruta, join(carpetaDestino, nombreArchivo));

      await rm(ruta, { force: true });

      this.logger.log({ nombreArchivo, msg: 'Archivo guardado' });
    } catch (error) {
      this.logger.error({ err: construirErrorParaLog(error), ruta, msg: 'No se pudo guardar el archivo' });
      throw error;
    }
  }
}
