import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function irAPaginaPresentacionesDdjj(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.bringToFront();

    await pagina.getByRole('heading', { name: 'Presentaciones' }).waitFor({ state: 'visible' });

    await pagina.locator('#menuConsultaDDJJ-link').click();

    logger.log({ msg: 'Consulta de DDJJ presentadas abierto' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Consulta de DDJJ presentadas' });
    throw new Error('No se pudo abrir Consulta de DDJJ presentadas', { cause: error });
  }
}
