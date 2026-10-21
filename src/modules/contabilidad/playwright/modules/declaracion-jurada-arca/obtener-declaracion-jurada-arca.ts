import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaSifereDdjj } from './acciones/ir-a-pagina-sifere-ddjj.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerCriterioDeBusqueda } from './acciones/obtener-criterio-de-busqueda.js';
import { buscarFilaDeLaDdjj } from './acciones/buscar-fila-de-la-ddjj.js';
import { presionarReporteDeDj } from './acciones/presionar-reporte-de-dj.js';

export async function obtenerDeclaracionJuradaArca(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo declaración jurada de ARCA' });

  const cuit = await obtenerCuitDelUsuario(logger, pagina);

  const paginaDdjj = await irAPaginaSifereDdjj(logger, contexto, pagina, cuit);

  try {
    const criterio = obtenerCriterioDeBusqueda(logger);

    const indiceFila = await buscarFilaDeLaDdjj(logger, paginaDdjj, criterio);

    if (indiceFila === null) {
      const motivo = 'No se encontró una DDJJ mensual para el período buscado';

      logger.warn({ motivo, msg: 'PDF no disponible: Declaración jurada de ARCA' });

      return noDisponible(motivo);
    }

    const promesaDescarga = paginaDdjj.waitForEvent('download');

    await presionarReporteDeDj(logger, paginaDdjj, indiceFila);

    const descarga = await promesaDescarga;

    const ruta = await descarga.path();

    logger.log({ cuit, msg: 'Declaración jurada de ARCA descargado' });

    return descargado(ruta);
  } finally {
    await paginaDdjj.close();
  }
}
