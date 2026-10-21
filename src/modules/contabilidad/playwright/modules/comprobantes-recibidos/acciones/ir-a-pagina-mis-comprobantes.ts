import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaMisComprobantes(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [myReceiptsPage] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.getByRole('heading', { name: 'MIS COMPROBANTES' }).click(),
    ]);

    await myReceiptsPage.bringToFront();

    await myReceiptsPage.waitForLoadState('domcontentloaded');

    await myReceiptsPage.locator('#titulo', { hasText: 'Mis Comprobantes' }).waitFor({
      state: 'visible',
    });

    logger.log({ msg: 'Mis Comprobantes abierto' });

    return myReceiptsPage;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Mis Comprobantes' });
    throw new Error('No se pudo abrir Mis Comprobantes', { cause: error });
  }
}
