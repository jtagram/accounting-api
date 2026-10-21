import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaMisComprobantes(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [paginaMisComprobantes] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.getByRole('heading', { name: 'MIS COMPROBANTES' }).click(),
    ]);

    await paginaMisComprobantes.bringToFront();

    await paginaMisComprobantes.waitForLoadState('domcontentloaded');

    await paginaMisComprobantes.locator('#titulo', { hasText: 'Mis Comprobantes' }).waitFor({
      state: 'visible',
    });

    logger.log({ msg: 'Mis Comprobantes abierto' });

    return paginaMisComprobantes;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Mis Comprobantes' });
    throw new Error('No se pudo abrir Mis Comprobantes', { cause: error });
  }
}
