import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

export async function irAPaginaMisServicios(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.locator('a[href="/portal/app/mis-servicios"]').click();

    await pagina.getByRole('heading', { level: 3, name: 'Mis servicios', exact: true }).waitFor({ state: 'visible' });

    await pagina.waitForLoadState('networkidle');

    logger.log({ msg: 'Mis servicios abierto' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Mis servicios' });
    throw new Error('No se pudo abrir Mis servicios', { cause: error });
  }
}
