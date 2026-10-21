import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import { localizarFilaDelPeriodo } from './localizar-fila-del-periodo.js';

export async function existeFilaDelPeriodo(logger: Logger, pagina: Page, periodo: string): Promise<boolean> {
  try {
    const existe = (await localizarFilaDelPeriodo(pagina, periodo).count()) > 0;

    logger.log({ periodo, existe, msg: 'Fila del período verificada' });

    return existe;
  } catch (error) {
    logger.error({
      err: construirErrorParaLog(error),
      periodo,
      msg: `No se pudo verificar si existe el período ${periodo}`,
    });
    throw new Error(`No se pudo verificar si existe el período ${periodo}`, { cause: error });
  }
}
