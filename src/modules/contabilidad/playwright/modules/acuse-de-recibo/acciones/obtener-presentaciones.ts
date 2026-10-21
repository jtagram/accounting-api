import type { BrowserContext } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import type { Presentacion } from './presentacion.js';

export async function obtenerPresentaciones(logger: Logger, contexto: BrowserContext, cuit: string): Promise<Presentacion[]> {
  try {
    const orden = encodeURIComponent(JSON.stringify({ valor: 'FECHA_PRESENTACION', tipo: 'desc' }));

    const respuestaLista = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/presentaciones/?usuario=TODOS&contribuyente=${cuit}&formulario=&mes=-&anio=-&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
    );

    if (!respuestaLista.ok()) {
      throw new Error(`No se pudo obtener la lista de presentaciones: ${respuestaLista.status()}`);
    }

    const { data } = await respuestaLista.json();

    const presentaciones: Presentacion[] = data?.resultados ?? [];

    logger.log({ cuit, cantidad: presentaciones.length, msg: 'Lista de presentaciones obtenida' });

    return presentaciones;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), cuit, msg: 'No se pudo obtener la lista de presentaciones' });
    throw new Error('No se pudo obtener la lista de presentaciones', { cause: error });
  }
}
