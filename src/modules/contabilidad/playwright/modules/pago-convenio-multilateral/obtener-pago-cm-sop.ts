import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerVeps } from './acciones/obtener-veps.js';
import { obtenerDescripcionDelMesPasado } from './acciones/obtener-descripcion-del-mes-pasado.js';
import { buscarVepPorDescripcion } from './acciones/buscar-vep-por-descripcion.js';
import { descargarComprobanteDePago } from './acciones/descargar-comprobante-de-pago.js';

export async function obtenerPagoCmSop(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo pago de convenio multilateral' });

  // Abrir el tile de DDJJ y Pagos ya deja la sesión de seti.afip.gob.ar
  // seteada, así que vamos directo a la API igual que con el monotributo.
  const paginaDdjj = await irAPaginaDdjjYPagos(logger, contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(logger, pagina);

    const veps = await obtenerVeps(logger, contexto, cuit);

    const descripcion = obtenerDescripcionDelMesPasado(logger);

    const vep = buscarVepPorDescripcion(veps, descripcion);

    if (!vep) {
      const motivo = `No se encontró un pago para ${descripcion}`;

      logger.warn({ motivo, msg: 'PDF no disponible: Pago de convenio multilateral' });

      return noDisponible(motivo);
    }

    const ruta = await descargarComprobanteDePago(logger, contexto, vep);

    logger.log({ descripcion, msg: 'Pago de convenio multilateral descargado' });

    return descargado(ruta);
  } finally {
    await paginaDdjj.close();
  }
}
