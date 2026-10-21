import { mkdir, rm } from 'node:fs/promises';
import type { Logger } from 'nestjs-pino';
import { obtenerCarpetaDestino } from './carpeta-destino.js';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

export async function prepararCarpetaDestino(logger: Logger, nombrePersona: string): Promise<string> {
  try {
    const carpetaDestino = obtenerCarpetaDestino(nombrePersona);

    await rm(carpetaDestino, { recursive: true, force: true });

    await mkdir(carpetaDestino, { recursive: true });

    logger.log({ nombre: nombrePersona, msg: 'Carpeta de destino preparada' });

    return carpetaDestino;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), nombre: nombrePersona, msg: 'No se pudo preparar la carpeta de destino' });
    throw error;
  }
}
