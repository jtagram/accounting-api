import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function obtenerCuitDelUsuario(logger: Logger, pagina: Page): Promise<string> {
  try {
    const cuit = (await pagina.locator('#usernav .numeroCuit').innerText())
      .trim()
      .replace(/-/g, '')
      .replace(/[[\]]/g, '');

    logger.log({ cuit, msg: 'CUIT del usuario obtenido' });

    return cuit;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo obtener el CUIT del usuario' });
    throw new Error('No se pudo obtener el CUIT del usuario', { cause: error });
  }
}
