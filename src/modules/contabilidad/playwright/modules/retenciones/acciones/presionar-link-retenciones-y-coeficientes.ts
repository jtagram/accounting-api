import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function presionarLinkRetencionesYCoeficientes(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('link', { name: 'Retenciones y coeficientes' }).click();

    logger.log({ msg: 'Link Retenciones y coeficientes presionado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo presionar el link Retenciones y coeficientes' });
    throw new Error('No se pudo presionar el link Retenciones y coeficientes', { cause: error });
  }
}
