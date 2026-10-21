import archiver from 'archiver';
import type { Readable } from 'node:stream';
import type { ArchivoDeTexto } from './archivo-de-texto.js';

// Comprime el contenido de la carpeta dentro de una carpeta `nombreEnZip` del ZIP,
// junto con los archivos de texto indicados.
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
