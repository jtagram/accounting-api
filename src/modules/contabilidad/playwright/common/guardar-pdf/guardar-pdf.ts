import { copyFile, mkdir, rm } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import type { Logger } from 'nestjs-pino';
import { obtenerCarpetaDestino } from './carpeta-destino.js';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

export async function guardarPdf(
  logger: Logger,
  rutaPdf: string,
  nombrePersona: string,
  nombreDescriptivo?: string,
): Promise<void> {
  try {
    const carpetaDestino = obtenerCarpetaDestino(nombrePersona);

    await mkdir(carpetaDestino, { recursive: true });

    const nombreBase = nombreDescriptivo ?? basename(rutaPdf);
    const nombreArchivo = extname(nombreBase) ? nombreBase : `${nombreBase}.pdf`;
    const destino = join(carpetaDestino, nombreArchivo);

    await copyFile(rutaPdf, destino);

    // El original es un temporal (de Playwright o de os.tmpdir()): ya no hace falta.
    await rm(rutaPdf, { force: true });

    logger.log({ nombreArchivo, msg: 'PDF guardado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), nombreDescriptivo, msg: 'No se pudo guardar el PDF' });
    throw error;
  }
}
