import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function esperarAlMenosUnComprobante(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('#tablaDataTables tbody tr[role="row"]').first().waitFor({
      state: 'visible',
    });

    logger.log({ msg: 'Al menos un comprobante visible' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo esperar al menos un comprobante' });
    throw error;
  }
}
