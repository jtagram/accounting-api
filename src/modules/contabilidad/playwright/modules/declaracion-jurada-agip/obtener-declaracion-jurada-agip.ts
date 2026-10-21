import type { BrowserContext } from 'playwright';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaAGIP } from './ir-a-pagina-agip.js';
import { iniciarSesion } from './iniciar-sesion.js';
import { irAPaginaESicol } from './ir-a-pagina-e-sicol.js';
import { abrirDeclaracionesJuradasPresentadas } from './abrir-declaraciones-juradas-presentadas.js';
import { seleccionarMesAnteriorDeclaracionJurada } from './seleccionar-mes-anterior-declaracion-jurada.js';
import { imprimirDeclaracionJurada } from './imprimir-declaracion-jurada.js';
import { descargarPdfDeclaracionJurada } from './descargar-pdf-declaracion-jurada.js';

export async function obtenerDeclaracionJuradaAGIP(contexto: BrowserContext, cuit: string, clave: string): Promise<ResultadoObtencion> {
  const paginaAgip = await irAPaginaAGIP(contexto);

  await iniciarSesion(paginaAgip, cuit, clave);

  const paginaESicol = await irAPaginaESicol(contexto, paginaAgip);

  await abrirDeclaracionesJuradasPresentadas(paginaESicol);

  const encontrada = await seleccionarMesAnteriorDeclaracionJurada(paginaESicol);

  if (!encontrada) {
    await paginaESicol.close();
    await paginaAgip.close();
    return noDisponible('No se encontró una DDJJ presentada para el período buscado en AGIP');
  }

  const urlPdf = await imprimirDeclaracionJurada(contexto, paginaESicol);

  const rutaPdf = await descargarPdfDeclaracionJurada(contexto, urlPdf);

  await paginaESicol.close();
  await paginaAgip.close();

  return descargado(rutaPdf);
}
