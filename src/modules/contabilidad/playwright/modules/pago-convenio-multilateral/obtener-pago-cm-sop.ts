import type { BrowserContext, Page } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerVeps } from './acciones/obtener-veps.js';
import { obtenerDescripcionDelMesPasado } from './acciones/obtener-descripcion-del-mes-pasado.js';
import { buscarVepPorDescripcion } from './acciones/buscar-vep-por-descripcion.js';
import { descargarComprobanteDePago } from './acciones/descargar-comprobante-de-pago.js';

export async function obtenerPagoCmSop(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {
  // Abrir el tile de DDJJ y Pagos ya deja la sesión de seti.afip.gob.ar
  // seteada, así que vamos directo a la API igual que con el monotributo.
  const paginaDdjj = await irAPaginaDdjjYPagos(contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(pagina);

    const veps = await obtenerVeps(contexto, cuit);

    const descripcion = obtenerDescripcionDelMesPasado();

    const vep = buscarVepPorDescripcion(veps, descripcion);

    if (!vep) {
      return noDisponible(`No se encontró un pago para ${descripcion}`);
    }

    return descargado(await descargarComprobanteDePago(contexto, vep));
  } finally {
    await paginaDdjj.close();
  }
}
