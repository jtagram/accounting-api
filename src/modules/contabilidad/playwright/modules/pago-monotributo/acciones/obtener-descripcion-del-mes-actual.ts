import type { Logger } from 'nestjs-pino';

export function obtenerDescripcionDelMesActual(logger: Logger): string {
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear()).slice(-2);

  const descripcion = `MONOTR${mesActual}/${anioActual}`;

  logger.log({ descripcion, msg: 'Descripción a buscar' });

  return descripcion;
}
