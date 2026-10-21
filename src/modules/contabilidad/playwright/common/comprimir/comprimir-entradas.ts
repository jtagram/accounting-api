import archiver from 'archiver';
import type { Readable } from 'node:stream';

export type EntradaZip =
  | { tipo: 'carpeta'; ruta: string; nombreEnZip: string }
  | { tipo: 'texto'; nombreEnZip: string; contenido: string };

export function comprimirEntradas(entradas: EntradaZip[]): Readable {
  const zip = archiver('zip', { zlib: { level: 9 } });

  for (const entrada of entradas) {
    if (entrada.tipo === 'carpeta') {
      zip.directory(entrada.ruta, entrada.nombreEnZip);
    } else {
      zip.append(entrada.contenido, { name: entrada.nombreEnZip });
    }
  }

  void zip.finalize();

  return zip;
}
