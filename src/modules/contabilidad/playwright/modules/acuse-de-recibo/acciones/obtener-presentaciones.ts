import type { BrowserContext } from 'playwright';
import type { Presentacion } from './presentacion.js';

export async function obtenerPresentaciones(contexto: BrowserContext, cuit: string): Promise<Presentacion[]> {
  try {
    const orden = encodeURIComponent(JSON.stringify({ valor: 'FECHA_PRESENTACION', tipo: 'desc' }));

    const respuestaLista = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/presentaciones/?usuario=TODOS&contribuyente=${cuit}&formulario=&mes=-&anio=-&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
    );

    if (!respuestaLista.ok()) {
      throw new Error(`No se pudo obtener la lista de presentaciones: ${respuestaLista.status()}`);
    }

    const { data } = await respuestaLista.json();

    return data?.resultados ?? [];
  } catch (error) {
    console.error('No se pudo obtener la lista de presentaciones', error);
    throw new Error('No se pudo obtener la lista de presentaciones', { cause: error });
  }
}
