import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaDdjjYPagos(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [paginaDdjj] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.locator('a[title="setidj"]').click(),
    ]);

    await paginaDdjj.bringToFront();

    await paginaDdjj.waitForLoadState('domcontentloaded');

    // El modal de "Novedades del servicio" solo aparece la primera vez (o si
    // no se tildó "No volver a mostrar"), así que lo cerramos solo si sale.
    const botonEntendido = paginaDdjj.getByRole('button', { name: 'Entendido' });

    if (await botonEntendido.isVisible({ timeout: 5000 }).catch(() => false)) {
      await botonEntendido.click();
    }

    logger.log({ msg: 'Presentación de DDJJ y Pagos abierto' });

    return paginaDdjj;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Presentación de DDJJ y Pagos' });
    throw new Error('No se pudo abrir Presentación de DDJJ y Pagos', { cause: error });
  }
}
