import type { BrowserContext, Page } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaDdjjYPagos } from './acciones/ir-a-pagina-ddjj-y-pagos.js';
import { obtenerCuitDelUsuario } from './acciones/obtener-cuit-del-usuario.js';
import { obtenerPresentaciones } from './acciones/obtener-presentaciones.js';
import { obtenerPeriodoMesPasado } from './acciones/obtener-periodo-mes-pasado.js';
import { buscarPresentacionDelPeriodo } from './acciones/buscar-presentacion-del-periodo.js';
import { descargarAcuseDeRecibo } from './acciones/descargar-acuse-de-recibo.js';

export async function obtenerAcuseDeRecibo(contexto: BrowserContext, pagina: Page): Promise<ResultadoObtencion> {

  const paginaDdjj = await irAPaginaDdjjYPagos(contexto, pagina);

  try {
    const cuit = await obtenerCuitDelUsuario(pagina);

    const presentaciones = await obtenerPresentaciones(contexto, cuit);

    const periodo = obtenerPeriodoMesPasado();

    const presentacion = buscarPresentacionDelPeriodo(presentaciones, periodo);

    if (!presentacion) {
      return noDisponible(`No se encontró una presentación para el período ${periodo}`);
    }

    return descargado(await descargarAcuseDeRecibo(contexto, presentacion));
  } finally {
    await paginaDdjj.close();
  }
}
