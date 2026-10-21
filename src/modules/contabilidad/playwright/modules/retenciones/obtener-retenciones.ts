import type { BrowserContext, Page } from 'playwright';
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

export async function obtenerRetenciones(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  const paginaConsultasSifere = await irAPaginaConsultasSifere(contexto, pagina);

  try {
    await irAPaginaInclusionesYRetenciones(paginaConsultasSifere);

    await buscarRetenciones(paginaConsultasSifere);

    await esperarResultadosDeBusqueda(paginaConsultasSifere);

    const periodo = obtenerPeriodoMesPasado();

    if (!(await existeFilaDelPeriodo(paginaConsultasSifere, periodo))) {
      return noDisponible(`No existe el período ${periodo}`);
    }

    if (!(await existeDetalleDelPeriodo(paginaConsultasSifere, periodo))) {
      return noDisponible(`No existe el detalle para ${periodo}`);
    }

    await abrirDetalleDelPeriodo(paginaConsultasSifere, periodo);

    const promesaDescarga = paginaConsultasSifere.waitForEvent('download');

    await presionarLinkRetencionesYCoeficientes(paginaConsultasSifere);

    const descarga = await promesaDescarga;

    return descargado(await descarga.path());
  } finally {
    await paginaConsultasSifere.close();
  }
}
