import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerVeps } from './acciones/obtener-veps.js';
import { obtenerDescripcionDelMesActual } from './acciones/obtener-descripcion-del-mes-actual.js';
import { buscarVepPorDescripcion } from './acciones/buscar-vep-por-descripcion.js';
import { descargarComprobanteDePago } from './acciones/descargar-comprobante-de-pago.js';

export async function obtenerPagoMonotributo(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo pago de monotributo' });

  const paginaDdjj = await irAPaginaDdjjYPagos(logger, contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(logger, pagina);

    const veps = await obtenerVeps(logger, contexto, cuit);

    const descripcion = obtenerDescripcionDelMesActual(logger);

    const vep = buscarVepPorDescripcion(veps, descripcion);

    if (!vep) {
      const motivo = `No se encontró un pago de monotributo para ${descripcion}`;

      logger.warn({ motivo, msg: 'PDF no disponible: Pago de monotributo' });

      return noDisponible(motivo);
    }

    const ruta = await descargarComprobanteDePago(logger, contexto, vep);

    logger.log({ descripcion, msg: 'Pago de monotributo descargado' });

    return descargado(ruta);
  } finally {
    await paginaDdjj.close();
  }
}
