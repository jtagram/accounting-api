import { copyFile, mkdir, rm } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { obtenerCarpetaDestino } from './carpeta-destino.js';

export async function guardarPdf(
  rutaPdf: string,
  nombrePersona: string,
  nombreDescriptivo?: string,
): Promise<void> {

  const carpetaDestino = obtenerCarpetaDestino(nombrePersona);

  await mkdir(carpetaDestino, { recursive: true });

  const nombreBase = nombreDescriptivo ?? basename(rutaPdf);
  const nombreArchivo = extname(nombreBase) ? nombreBase : `${nombreBase}.pdf`;
  const destino = join(carpetaDestino, nombreArchivo);

  await copyFile(rutaPdf, destino);

  // El original es un temporal (de Playwright o de os.tmpdir()): ya no hace falta.
  await rm(rutaPdf, { force: true });
}
