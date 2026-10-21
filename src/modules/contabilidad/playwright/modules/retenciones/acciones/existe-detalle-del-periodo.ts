import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import { localizarIconoDetalle } from './localizar-fila-del-periodo.js';

export async function existeDetalleDelPeriodo(logger: Logger, pagina: Page, periodo: string): Promise<boolean> {
  try {
    const existe = (await localizarIconoDetalle(pagina, periodo).count()) > 0;

    logger.log({ periodo, existe, msg: 'Detalle del período verificado' });

    return existe;
  } catch (error) {
    logger.error({
      err: construirErrorParaLog(error),
      periodo,
      msg: `No se pudo verificar si existe el detalle del período ${periodo}`,
    });
    throw new Error(`No se pudo verificar si existe el detalle del período ${periodo}`, { cause: error });
  }
}
