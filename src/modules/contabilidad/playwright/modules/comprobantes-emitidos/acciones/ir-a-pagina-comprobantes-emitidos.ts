import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaComprobantesEmitidos(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('#btnEmitidos').click();

    await pagina.locator('#titulo', { hasText: 'Comprobantes Emitidos' }).waitFor({
      state: 'visible',
    });

    logger.log({ msg: 'Comprobantes Emitidos abierto' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Comprobantes Emitidos' });
    throw new Error('No se pudo abrir Comprobantes Emitidos', { cause: error });
  }
}
