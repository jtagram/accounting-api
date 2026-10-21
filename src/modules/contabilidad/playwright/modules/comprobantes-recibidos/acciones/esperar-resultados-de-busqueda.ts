import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function esperarResultadosDeBusqueda(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.waitForLoadState('networkidle');

    logger.log({ msg: 'Resultados de la búsqueda cargados' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudieron cargar los resultados de la búsqueda' });
    throw new Error('No se pudieron cargar los resultados de la búsqueda', { cause: error });
  }
}
