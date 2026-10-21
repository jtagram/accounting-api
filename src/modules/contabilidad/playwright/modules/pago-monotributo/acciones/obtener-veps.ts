import type { BrowserContext } from 'playwright';
import type { Vep } from './vep.js';

export async function obtenerVeps(contexto: BrowserContext, cuit: string): Promise<Vep[]> {
  try {
    const orden = encodeURIComponent(JSON.stringify({ valor: 'vepId', tipo: 'desc' }));

    const respuestaLista = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/pagos?usuario=TODOS&contribuyente=${cuit}&estado=seticommon.todos.rotulo&tipoDePago=TODOS&mes=-&anio=-&ultimosMeses=12&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
    );

    if (!respuestaLista.ok()) {
      throw new Error(`No se pudo obtener la lista de pagos: ${respuestaLista.status()}`);
    }

    const { data } = await respuestaLista.json();

    return data?.vepsConsultados ?? [];
  } catch (error) {
    console.error('No se pudo obtener la lista de pagos', error);
    throw new Error('No se pudo obtener la lista de pagos', { cause: error });
  }
}
