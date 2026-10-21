import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function seleccionarMesAnterior(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('#fechaEmision').click();

    await pagina.locator('li[data-range-key="Mes Pasado"]').click();

    const rangoFechas = await pagina.locator('#fechaEmision').inputValue();

    verificarMesAnterior(logger, rangoFechas);

    logger.log({ rangoFechas, msg: 'Rango de fechas seleccionado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo seleccionar el mes pasado' });
    throw error;
  }
}

function verificarMesAnterior(logger: Logger, rangoFechas: string): void {
  const hoy = new Date();
  const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const ultimoDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

  const formatearFecha = (fecha: Date) =>
    `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

  const rangoEsperado = `${formatearFecha(primerDiaMesPasado)} - ${formatearFecha(ultimoDiaMesPasado)}`;

  if (rangoFechas !== rangoEsperado) {
    logger.error({ rangoFechas, rangoEsperado, msg: 'El rango de fechas no corresponde al mes pasado' });
    throw new Error(`El rango de fechas (${rangoFechas}) no corresponde al mes pasado (${rangoEsperado})`);
  }
}
