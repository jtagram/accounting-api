import archiver from 'archiver';
import type { Readable } from 'node:stream';
import type { ArchivoDeTexto } from './archivo-de-texto.js';

// Arma un ZIP con una carpeta `nombreEnZip` que contiene solo los archivos de texto indicados.
export function comprimirArchivosDeTexto(nombreEnZip: string, archivosDeTexto: ArchivoDeTexto[]): Readable {
  const zip = archiver('zip', { zlib: { level: 9 } });

  for (const archivo of archivosDeTexto) {
    zip.append(archivo.contenido, { name: `${nombreEnZip}/${archivo.nombre}` });
  }

  void zip.finalize();

  return zip;
}
