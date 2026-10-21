export interface CriterioDeBusqueda {
  anticipoBuscado: string;
  mesActual: number;
  anioActual: number;
}

export function obtenerCriterioDeBusqueda(): CriterioDeBusqueda {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  const mesPasadoFecha = new Date(hoy);
  mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
  const anticipoBuscado = `${mesPasadoFecha.getFullYear()}${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

  console.log(`Anticipo a buscar: ${anticipoBuscado}, fecha de creación del mes ${mesActual}/${anioActual}`);

  return { anticipoBuscado, mesActual, anioActual };
}
