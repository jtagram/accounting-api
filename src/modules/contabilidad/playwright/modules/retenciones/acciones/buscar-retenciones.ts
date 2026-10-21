import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function buscarRetenciones(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('button', { name: 'Buscar' }).click();

    logger.log({ msg: 'Búsqueda de retenciones ejecutada' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo buscar las retenciones' });
    throw new Error('No se pudo buscar las retenciones', { cause: error });
  }
}
