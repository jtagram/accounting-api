import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function buscarComprobantes(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('#buscarComprobantes').click();

    logger.log({ msg: 'Búsqueda de comprobantes ejecutada' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo buscar los comprobantes' });
    throw new Error('No se pudo buscar los comprobantes', { cause: error });
  }
}
