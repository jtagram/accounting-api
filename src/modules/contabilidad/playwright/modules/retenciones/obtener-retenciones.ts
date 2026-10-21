import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaConsultasSifere } from './acciones/ir-a-pagina-consultas-sifere.js';
import { irAPaginaInclusionesYRetenciones } from './acciones/ir-a-pagina-inclusiones-y-retenciones.js';
import { buscarRetenciones } from './acciones/buscar-retenciones.js';
import { esperarResultadosDeBusqueda } from './acciones/esperar-resultados-de-busqueda.js';
import { obtenerPeriodoMesPasado } from './acciones/obtener-periodo-mes-pasado.js';
import { existeFilaDelPeriodo } from './acciones/existe-fila-del-periodo.js';
import { existeDetalleDelPeriodo } from './acciones/existe-detalle-del-periodo.js';
import { abrirDetalleDelPeriodo } from './acciones/abrir-detalle-del-periodo.js';
import { presionarLinkRetencionesYCoeficientes } from './acciones/presionar-link-retenciones-y-coeficientes.js';

export async function obtenerRetenciones(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  logger.log({ msg: 'Obteniendo retenciones' });

  const paginaConsultasSifere = await irAPaginaConsultasSifere(logger, contexto, pagina);

  try {
    await irAPaginaInclusionesYRetenciones(logger, paginaConsultasSifere);

    await buscarRetenciones(logger, paginaConsultasSifere);

    await esperarResultadosDeBusqueda(logger, paginaConsultasSifere);

    const periodo = obtenerPeriodoMesPasado(logger);

    if (!(await existeFilaDelPeriodo(logger, paginaConsultasSifere, periodo))) {
      const motivo = `No existe el período ${periodo}`;

      logger.warn({ motivo, msg: 'PDF no disponible: Retenciones' });

      return noDisponible(motivo);
    }

    if (!(await existeDetalleDelPeriodo(logger, paginaConsultasSifere, periodo))) {
      const motivo = `No existe el detalle para ${periodo}`;

      logger.warn({ motivo, msg: 'PDF no disponible: Retenciones' });

      return noDisponible(motivo);
    }

    await abrirDetalleDelPeriodo(logger, paginaConsultasSifere, periodo);

    const promesaDescarga = paginaConsultasSifere.waitForEvent('download');

    await presionarLinkRetencionesYCoeficientes(logger, paginaConsultasSifere);

    const descarga = await promesaDescarga;

    const ruta = await descarga.path();

    logger.log({ periodo, msg: 'Retenciones descargado' });

    return descargado(ruta);
  } finally {
    await paginaConsultasSifere.close();
  }
}
