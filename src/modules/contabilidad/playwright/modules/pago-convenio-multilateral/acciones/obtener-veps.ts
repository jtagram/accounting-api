import type { BrowserContext } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import type { Vep } from './vep.js';

export async function obtenerVeps(logger: Logger, contexto: BrowserContext, cuit: string): Promise<Vep[]> {
  try {
    const orden = encodeURIComponent(JSON.stringify({ valor: 'vepId', tipo: 'desc' }));

    const respuestaLista = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/pagos?usuario=TODOS&contribuyente=${cuit}&estado=seticommon.todos.rotulo&tipoDePago=TODOS&mes=-&anio=-&ultimosMeses=12&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
    );

    if (!respuestaLista.ok()) {
      throw new Error(`No se pudo obtener la lista de pagos: ${respuestaLista.status()}`);
    }

    const { data } = await respuestaLista.json();

    const veps: Vep[] = data?.vepsConsultados ?? [];

    logger.log({ cuit, cantidad: veps.length, msg: 'Lista de pagos obtenida' });

    return veps;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), cuit, msg: 'No se pudo obtener la lista de pagos' });
    throw new Error('No se pudo obtener la lista de pagos', { cause: error });
  }
}
