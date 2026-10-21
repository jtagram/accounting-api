import type { BrowserContext, Page } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerVeps } from './acciones/obtener-veps.js';
import { obtenerDescripcionDelMesActual } from './acciones/obtener-descripcion-del-mes-actual.js';
import { buscarVepPorDescripcion } from './acciones/buscar-vep-por-descripcion.js';
import { descargarComprobanteDePago } from './acciones/descargar-comprobante-de-pago.js';

export async function obtenerPagoMonotributo(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {

  const paginaDdjj = await irAPaginaDdjjYPagos(contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(pagina);

    const veps = await obtenerVeps(contexto, cuit);

    const descripcion = obtenerDescripcionDelMesActual();

    const vep = buscarVepPorDescripcion(veps, descripcion);

    if (!vep) {
      return noDisponible(`No se encontró un pago de monotributo para ${descripcion}`);
    }

    return descargado(await descargarComprobanteDePago(contexto, vep));
  } finally {
    await paginaDdjj.close();
  }
}
