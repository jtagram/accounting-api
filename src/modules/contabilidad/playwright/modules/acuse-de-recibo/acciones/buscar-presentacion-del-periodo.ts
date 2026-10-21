import type { Presentacion } from './presentacion.js';

export function buscarPresentacionDelPeriodo(presentaciones: Presentacion[], periodo: string): Presentacion | null {
  return presentaciones.find((presentacion) => presentacion.periodo === periodo) ?? null;
}
