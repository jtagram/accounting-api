import type { BrowserContext } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Vep } from './vep.js';

export async function descargarComprobanteDePago(contexto: BrowserContext, vep: Vep): Promise<string> {
  try {
    const respuestaTicket = await contexto.request.get(
      `https://seti.afip.gob.ar/setiweb/api/pagos/${vep.nroVep}/ticket?formato=PDF`,
    );

    if (!respuestaTicket.ok()) {
      throw new Error(`No se pudo descargar el comprobante de pago: ${respuestaTicket.status()}`);
    }

    const contenido = await respuestaTicket.body();
    const rutaPdf = join(tmpdir(), `pago-monotributo-${vep.nroVep}.pdf`);

    await writeFile(rutaPdf, contenido);

    return rutaPdf;
  } catch (error) {
    console.error('No se pudo descargar el comprobante de pago', error);
    throw new Error('No se pudo descargar el comprobante de pago', { cause: error });
  }
}
