// Resultado explícito de obtener un PDF: o se descargó (con su ruta) o el cliente no lo tiene (con el motivo).
export type ResultadoObtencion = { descargado: true; ruta: string } | { descargado: false; motivo: string };

export function descargado(ruta: string): ResultadoObtencion {
  return { descargado: true, ruta };
}

export function noDisponible(motivo: string): ResultadoObtencion {
  return { descargado: false, motivo };
}
