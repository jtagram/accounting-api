import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';

// En e-Sicol las DDJJ están agrupadas en una grilla (ExtJS). El encabezado del
// grupo dice "Declaraciones Juradas Presentadas: N", donde N varía, y el id de
// la grilla (gridview-1066) lo genera ExtJS, así que buscamos por el texto.
export async function abrirDeclaracionesJuradasPresentadas(logger: Logger, pagina: Page): Promise<void> {
  try {
    const grupoPresentadas = pagina
      .locator('tr.x-grid-group-hd')
      .filter({ hasText: /Declaraciones Juradas Presentadas:\s*\d+/ });

    await grupoPresentadas.waitFor({ state: 'visible', timeout: 60000 });

    // Si el grupo ya está expandido, otro click lo colapsaría.
    const estaColapsado = await grupoPresentadas.evaluate((tr) => tr.classList.contains('x-grid-group-hd-collapsed'));

    if (estaColapsado) {
      await grupoPresentadas.locator('.x-grid-group-title').click();

      await pagina
        .locator('tr.x-grid-group-hd:not(.x-grid-group-hd-collapsed)')
        .filter({ hasText: /Declaraciones Juradas Presentadas:\s*\d+/ })
        .waitFor({ state: 'visible' });
    }

    const titulo = (await grupoPresentadas.innerText()).trim();

    logger.log({ titulo, msg: `${titulo} (grupo expandido)` });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Declaraciones Juradas Presentadas' });
    throw new Error('No se pudo abrir Declaraciones Juradas Presentadas', { cause: error });
  }
}
