import type { BrowserContext, Page } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaSifereDdjj } from './acciones/ir-a-pagina-sifere-ddjj.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerCriterioDeBusqueda } from './acciones/obtener-criterio-de-busqueda.js';
import { buscarFilaDeLaDdjj } from './acciones/buscar-fila-de-la-ddjj.js';
import { presionarReporteDeDj } from './acciones/presionar-reporte-de-dj.js';

export async function obtenerDeclaracionJuradaArca(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  const cuit = await obtenerCuitDelUsuario(pagina);

  const paginaDdjj = await irAPaginaSifereDdjj(contexto, pagina, cuit);

  try {
    const criterio = obtenerCriterioDeBusqueda();

    const indiceFila = await buscarFilaDeLaDdjj(paginaDdjj, criterio);

    if (indiceFila === null) {
      return noDisponible('No se encontró una DDJJ mensual para el período buscado');
    }

    const promesaDescarga = paginaDdjj.waitForEvent('download');

    await presionarReporteDeDj(paginaDdjj, indiceFila);

    const descarga = await promesaDescarga;

    return descargado(await descarga.path());
  } finally {
    await paginaDdjj.close();
  }
}
