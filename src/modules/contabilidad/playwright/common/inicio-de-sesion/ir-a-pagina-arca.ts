import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

export async function irAPaginaARCA(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.goto('https://www.arca.gob.ar/');

    await pagina.getByRole('link', { name: 'Iniciar sesión' }).waitFor({ state: 'visible' });

    logger.log({ msg: 'Página de ARCA abierta' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir ARCA' });
    throw new Error('No se pudo abrir ARCA', { cause: error });
  }
}
