import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaMisComprobantes } from './acciones/ir-a-pagina-mis-comprobantes.js';
import { irAPaginaComprobantesRecibidos } from './acciones/ir-a-pagina-comprobantes-recibidos.js';
import { seleccionarMesAnterior } from './acciones/seleccionar-mes-anterior.js';
import { buscarComprobantes } from './acciones/buscar-comprobantes.js';
import { esperarResultadosDeBusqueda } from './acciones/esperar-resultados-de-busqueda.js';
import { presionarBotonPdf } from './acciones/presionar-boton-pdf.js';
import { noHayComprobantesEmitidos } from './acciones/no-hay-comprobantes-emitidos.js';
import { esperarAlMenosUnComprobante } from './acciones/esperar-al-menos-un-comprobante.js';

export async function obtenerComprobantesRecibidos(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo comprobantes recibidos' });

  const paginaMisComprobantes = await irAPaginaMisComprobantes(logger, contexto, pagina);

  try {
    await irAPaginaComprobantesRecibidos(logger, paginaMisComprobantes);

    await seleccionarMesAnterior(logger, paginaMisComprobantes);

    await buscarComprobantes(logger, paginaMisComprobantes);

    await esperarResultadosDeBusqueda(logger, paginaMisComprobantes);

    if (await noHayComprobantesEmitidos(logger, paginaMisComprobantes)) {
      const motivo = 'No hay comprobantes recibidos en el mes anterior';

      logger.warn({ motivo, msg: 'PDF no disponible: Comprobantes recibidos' });

      return noDisponible(motivo);
    }

    await esperarAlMenosUnComprobante(logger, paginaMisComprobantes);

    const promesaDescarga = paginaMisComprobantes.waitForEvent('download');

    await presionarBotonPdf(logger, paginaMisComprobantes);

    const descarga = await promesaDescarga;

    const ruta = await descarga.path();

    logger.log({ msg: 'Comprobantes recibidos descargado' });

    return descargado(ruta);
  } finally {
    await paginaMisComprobantes.close();
  }
}
