import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Ubuntu en español usa ~/Descargas; Windows (y Linux en inglés) usan ~/Downloads.
const carpetaDescargas = existsSync(join(homedir(), 'Descargas'))
  ? join(homedir(), 'Descargas')
  : join(homedir(), 'Downloads');

const CARPETA_BASE = join(carpetaDescargas, 'PDFs - contables');

export function sanitizarNombre(nombre: string): string {
  return nombre.replace(/[\\/:*?"<>|]/g, '');
}

export function obtenerCarpetaDestino(nombrePersona: string): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();

  const nombreCarpeta = sanitizarNombre(`${nombrePersona} - ${mes}-${anio}`);

  return join(CARPETA_BASE, nombreCarpeta);
}
