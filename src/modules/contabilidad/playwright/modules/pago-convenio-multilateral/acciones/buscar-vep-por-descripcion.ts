import type { Vep } from './vep.js';

export function buscarVepPorDescripcion(veps: Vep[], descripcion: string): Vep | null {
  return veps.find((vep) => vep.descripcion === descripcion) ?? null;
}
