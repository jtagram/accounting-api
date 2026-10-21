import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

export async function noHayComprobantesEmitidos(logger: Logger, pagina: Page): Promise<boolean> {
  try {
    const noExisteInformacion = pagina.locator('td.dataTables_empty', {
      hasText: 'No existe información para los filtros ingresados',
    });

    const infoSinRegistros = pagina.locator('#tablaDataTables_info', {
      hasText: 'Mostrando 0 registros de un total de 0',
    });

    const alMenosUnComprobante = pagina.locator('#tablaDataTables tbody tr[role="row"]').first();

    const sinComprobantes = Promise.all([
      noExisteInformacion.waitFor({ state: 'visible' }),
      infoSinRegistros.waitFor({ state: 'visible' }),
    ]).then(() => true as const);

    const conComprobantes = alMenosUnComprobante.waitFor({ state: 'visible' }).then(() => false as const);

    // evita "unhandled rejection" de la promesa que pierde la carrera
    sinComprobantes.catch(() => {});
    conComprobantes.catch(() => {});

    const noHayComprobantes = await Promise.race([sinComprobantes, conComprobantes]);

    if (noHayComprobantes) {
      logger.log({
        informacion: await noExisteInformacion.innerText(),
        registros: await infoSinRegistros.innerText(),
        msg: 'No hay comprobantes para los filtros ingresados',
      });
    } else {
      logger.log({ msg: 'Hay comprobantes para los filtros ingresados' });
    }

    return noHayComprobantes;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo verificar si hay comprobantes' });
    throw error;
  }
}
