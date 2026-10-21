import type { Logger } from 'nestjs-pino';

export interface CriterioDeBusqueda {
  anticipoBuscado: string;
  mesActual: number;
  anioActual: number;
}

export function obtenerCriterioDeBusqueda(logger: Logger): CriterioDeBusqueda {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  const mesPasadoFecha = new Date(hoy);
  mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
  const anticipoBuscado = `${mesPasadoFecha.getFullYear()}${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

  logger.log({ anticipoBuscado, mesActual, anioActual, msg: 'Criterio de búsqueda de la DDJJ' });

  return { anticipoBuscado, mesActual, anioActual };
}
