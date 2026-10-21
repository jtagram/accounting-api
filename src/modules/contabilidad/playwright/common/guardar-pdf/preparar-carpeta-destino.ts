import { mkdir, rm } from 'node:fs/promises';
import { obtenerCarpetaDestino } from './carpeta-destino.js';

// Deja la carpeta del cliente vacía para que el ZIP solo tenga los PDFs de esta ejecución.
export async function prepararCarpetaDestino(nombrePersona: string): Promise<string> {
  const carpetaDestino = obtenerCarpetaDestino(nombrePersona);

  await rm(carpetaDestino, { recursive: true, force: true });

  await mkdir(carpetaDestino, { recursive: true });

  return carpetaDestino;
}
