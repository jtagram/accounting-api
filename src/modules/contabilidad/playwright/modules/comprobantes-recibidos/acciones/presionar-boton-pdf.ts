import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function presionarBotonPdf(logger: Logger, pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('button', { name: 'PDF' }).click();

    logger.log({ msg: 'Botón PDF presionado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo presionar el botón PDF' });
    throw new Error('No se pudo presionar el botón PDF', { cause: error });
  }
}
