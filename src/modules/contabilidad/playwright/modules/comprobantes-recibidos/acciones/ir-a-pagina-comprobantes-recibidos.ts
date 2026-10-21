import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaComprobantesRecibidos(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('#btnRecibidos').click();

    await pagina.locator('#titulo', { hasText: 'Comprobantes Recibidos' }).waitFor({
      state: 'visible',
    });

    logger.log({ msg: 'Comprobantes Recibidos abierto' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Comprobantes Recibidos' });
    throw new Error('No se pudo abrir Comprobantes Recibidos', { cause: error });
  }
}
