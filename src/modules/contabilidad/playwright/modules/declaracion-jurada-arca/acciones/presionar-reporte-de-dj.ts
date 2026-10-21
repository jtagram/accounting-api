import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function presionarReporteDeDj(logger: Logger, pagina: Page, indiceFila: number): Promise<void> {
  try {
    await pagina.locator('#tableMensualDj tbody tr').nth(indiceFila).locator('a[title="Reporte de DJ"]').click();

    logger.log({ indiceFila, msg: 'Reporte de DJ presionado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), indiceFila, msg: 'No se pudo presionar el Reporte de DJ' });
    throw new Error('No se pudo presionar el Reporte de DJ', { cause: error });
  }
}
