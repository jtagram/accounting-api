import type { Logger } from 'nestjs-pino';

export function obtenerPeriodoMesPasado(logger: Logger): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - 1);

  const mesPasado = String(fecha.getMonth() + 1).padStart(2, '0');
  const anioPasado = fecha.getFullYear();

  const periodo = `${mesPasado}/${anioPasado}`;

  logger.log({ periodo, msg: 'Período a buscar' });

  return periodo;
}
