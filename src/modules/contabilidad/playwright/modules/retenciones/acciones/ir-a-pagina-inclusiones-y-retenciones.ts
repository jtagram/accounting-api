import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaInclusionesYRetenciones(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.bringToFront();

    await pagina.waitForLoadState('domcontentloaded');

    await pagina.getByRole('heading', { name: 'DEDUCCIONES' }).hover();

    await pagina
      .locator('a[href="srbPadron.do?method=buscarIn"]', { hasText: 'Inclusiones y Retenciones' })
      .click();

    logger.log({ msg: 'Inclusiones y Retenciones abierto' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Inclusiones y Retenciones' });
    throw new Error('No se pudo abrir Inclusiones y Retenciones', { cause: error });
  }
}
