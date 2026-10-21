import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';

// Cada fila de la grilla de e-Sicol tiene: [ícono, estado, período (YYYY-MM),
// fecha, fecha, tipo]. Buscamos la DDJJ presentada cuyo período es el mes pasado.
export async function seleccionarMesAnteriorDeclaracionJurada(logger: Logger, pagina: Page): Promise<boolean> {
  try {
    const mesPasadoFecha = new Date();
    mesPasadoFecha.setDate(1);
    mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
    const periodoBuscado = `${mesPasadoFecha.getFullYear()}-${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

    logger.log({ periodo: periodoBuscado, msg: 'Período de DDJJ a buscar en e-Sicol' });

    const filaMesPasado = pagina
      .locator('tr.x-grid-row')
      .filter({ has: pagina.locator('td:nth-child(2)', { hasText: /^\s*Presentada\s*$/ }) })
      .filter({ has: pagina.locator('td:nth-child(3)', { hasText: new RegExp(`^\\s*${periodoBuscado}\\s*$`) }) })
      .first();

    if ((await filaMesPasado.count()) === 0) {
      logger.log({ periodo: periodoBuscado, msg: 'No se encontró una DDJJ presentada para el período' });
      return false;
    }

    await filaMesPasado.click();

    logger.log({ periodo: periodoBuscado, msg: 'DDJJ del período seleccionada' });

    return true;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo seleccionar la DDJJ del mes pasado' });
    throw new Error('No se pudo seleccionar la DDJJ del mes pasado', { cause: error });
  }
}
