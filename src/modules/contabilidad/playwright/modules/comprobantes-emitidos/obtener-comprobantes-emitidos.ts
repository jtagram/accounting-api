import type { BrowserContext, Page } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaMisComprobantes } from './acciones/ir-a-pagina-mis-comprobantes.js';
import { irAPaginaComprobantesEmitidos } from './acciones/ir-a-pagina-comprobantes-emitidos.js';
import { seleccionarMesAnterior } from './acciones/seleccionar-mes-anterior.js';
import { buscarComprobantes } from './acciones/buscar-comprobantes.js';
import { esperarResultadosDeBusqueda } from './acciones/esperar-resultados-de-busqueda.js';
import { presionarBotonPdf } from './acciones/presionar-boton-pdf.js';
import { noHayComprobantesEmitidos } from './acciones/no-hay-comprobantes-emitidos.js';
import { esperarAlMenosUnComprobante } from './acciones/esperar-al-menos-un-comprobante.js';

export async function obtenerComprobantesEmitidos(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  const paginaMisComprobantes = await irAPaginaMisComprobantes(contexto, pagina);

  try {
    await irAPaginaComprobantesEmitidos(paginaMisComprobantes);

    await seleccionarMesAnterior(paginaMisComprobantes);

    await buscarComprobantes(paginaMisComprobantes);

    await esperarResultadosDeBusqueda(paginaMisComprobantes);

    if (await noHayComprobantesEmitidos(paginaMisComprobantes)) {
      return noDisponible('No hay comprobantes emitidos en el mes anterior');
    }

    await esperarAlMenosUnComprobante(paginaMisComprobantes);

    const promesaDescarga = paginaMisComprobantes.waitForEvent('download');

    await presionarBotonPdf(paginaMisComprobantes);

    const descarga = await promesaDescarga;

    return descargado(await descarga.path());
  } finally {
    await paginaMisComprobantes.close();
  }
}

