import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import { localizarIconoDetalle } from './localizar-fila-del-periodo.js';

export async function abrirDetalleDelPeriodo(logger: Logger, pagina: Page, periodo: string): Promise<void> {
  try {
    await localizarIconoDetalle(pagina, periodo).click();

    logger.log({ periodo, msg: 'Detalle abierto para el período' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), periodo, msg: `No se pudo abrir el detalle del período ${periodo}` });
    throw new Error(`No se pudo abrir el detalle del período ${periodo}`, { cause: error });
  }
}
