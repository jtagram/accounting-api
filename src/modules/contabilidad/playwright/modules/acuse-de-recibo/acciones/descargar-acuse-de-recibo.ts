import type { BrowserContext } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import type { Presentacion } from './presentacion.js';

export async function descargarAcuseDeRecibo(logger: Logger, contexto: BrowserContext, presentacion: Presentacion): Promise<string> {
  try {
    const cabeceras = encodeURIComponent(JSON.stringify({ Accept: 'application/pdf' }));

    const respuestaTicket = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/presentaciones/${presentacion.transaccion}/ticket?formato=PDF&responseType=arraybuffer&headers=${cabeceras}`,
    );

    if (!respuestaTicket.ok()) {
      throw new Error(`No se pudo descargar el acuse de recibo: ${respuestaTicket.status()}`);
    }

    const contenido = await respuestaTicket.body();
    const rutaPdf = join(tmpdir(), `acuse-de-recibo-${presentacion.transaccion}.pdf`);

    await writeFile(rutaPdf, contenido);

    logger.log({ transaccion: presentacion.transaccion, periodo: presentacion.periodo, msg: 'Acuse de recibo descargado' });

    return rutaPdf;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), transaccion: presentacion.transaccion, msg: 'No se pudo descargar el acuse de recibo' });
    throw new Error('No se pudo descargar el acuse de recibo', { cause: error });
  }
}
