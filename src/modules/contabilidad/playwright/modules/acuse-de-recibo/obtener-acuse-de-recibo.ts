import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerPresentaciones } from './acciones/obtener-presentaciones.js';
import { obtenerPeriodoMesPasado } from './acciones/obtener-periodo-mes-pasado.js';
import { buscarPresentacionDelPeriodo } from './acciones/buscar-presentacion-del-periodo.js';
import { descargarAcuseDeRecibo } from './acciones/descargar-acuse-de-recibo.js';

export async function obtenerAcuseDeRecibo(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo acuse de recibo' });

  const paginaDdjj = await irAPaginaDdjjYPagos(logger, contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(logger, pagina);

    const presentaciones = await obtenerPresentaciones(logger, contexto, cuit);

    const periodo = obtenerPeriodoMesPasado(logger);

    const presentacion = buscarPresentacionDelPeriodo(presentaciones, periodo);

    if (!presentacion) {
      const motivo = `No se encontró una presentación para el período ${periodo}`;

      logger.warn({ motivo, msg: 'PDF no disponible: Acuse de recibo' });

      return noDisponible(motivo);
    }

    const ruta = await descargarAcuseDeRecibo(logger, contexto, presentacion);

    logger.log({ periodo, msg: 'Acuse de recibo descargado' });

    return descargado(ruta);
  } finally {
    await paginaDdjj.close();
  }
}
