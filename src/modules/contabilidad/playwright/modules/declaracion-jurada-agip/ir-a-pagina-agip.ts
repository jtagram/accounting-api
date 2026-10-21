import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';

export async function irAPaginaAGIP(logger: Logger, contexto: BrowserContext): Promise<Page> {
  try {
    const paginaAgip = await contexto.newPage();

    await paginaAgip.goto('https://claveciudad.agip.gob.ar/#', { waitUntil: 'domcontentloaded', timeout: 60000 });

    logger.log({ msg: 'Página de AGIP abierta' });

    return paginaAgip;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir AGIP' });
    throw new Error('No se pudo abrir AGIP', { cause: error });
  }
}
