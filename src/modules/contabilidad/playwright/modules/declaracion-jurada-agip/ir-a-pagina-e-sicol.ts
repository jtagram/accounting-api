import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';

export async function irAPaginaESicol(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const servicioESicol = pagina
      .locator('#aplicaciones .contiene_servicio')
      .filter({ has: pagina.locator('.titulo_servicio', { hasText: /^\s*e-Sicol\s*$/ }) })
      .locator('a.learn-more');

    // ir_servicio(...) puede abrir el servicio en una pestaña nueva o en la
    // misma: escuchamos si aparece una pestaña nueva y, si no, seguimos en la actual.
    const promesaVentanaEmergente = contexto.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    await servicioESicol.click();

    const paginaESicol = (await promesaVentanaEmergente) ?? pagina;

    await paginaESicol.waitForLoadState('domcontentloaded', { timeout: 60000 });

    logger.log({ msg: 'e-Sicol abierto' });

    return paginaESicol;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir e-Sicol' });
    throw new Error('No se pudo abrir e-Sicol', { cause: error });
  }
}
