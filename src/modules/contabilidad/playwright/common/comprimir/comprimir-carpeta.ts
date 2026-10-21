import archiver from 'archiver';
import type { Readable } from 'node:stream';
import type { ArchivoDeTexto } from './archivo-de-texto.js';

export function comprimirCarpeta(
  carpeta: string,
  nombreEnZip: string,
  archivosDeTexto: ArchivoDeTexto[] = [],
): Readable {
  const zip = archiver('zip', { zlib: { level: 9 } });

  zip.directory(carpeta, nombreEnZip);

  for (const archivo of archivosDeTexto) {
    zip.append(archivo.contenido, { name: `${nombreEnZip}/${archivo.nombre}` });
  }

  void zip.finalize();

  return zip;
}
