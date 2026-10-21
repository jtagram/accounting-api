import type { Readable } from 'node:stream';

export interface RespuestaEjecucion {
  nombre: string;
  exito: boolean;
  zip: Readable;
}
