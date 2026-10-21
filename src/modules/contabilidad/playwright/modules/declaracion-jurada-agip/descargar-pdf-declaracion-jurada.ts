import type { BrowserContext } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// El PDF se muestra en el visor de Chrome, de donde no se puede sacar el
// archivo. Lo pedimos de nuevo con la misma sesión (cookies del contexto)
// y lo guardamos en disco.
export async function descargarPdfDeclaracionJurada(contexto: BrowserContext, urlPdf: string): Promise<string> {
  try {
    const respuestaPdf = await contexto.request.get(urlPdf, { timeout: 60000 });

    if (!respuestaPdf.ok()) {
      throw new Error(`No se pudo descargar el PDF de la DDJJ: ${respuestaPdf.status()}`);
    }

    const ddjjId = new URL(urlPdf).searchParams.get('ddjjId') ?? String(Date.now());

    const contenido = await respuestaPdf.body();
    const rutaPdf = join(tmpdir(), `ddjj-agip-${ddjjId}.pdf`);

    await writeFile(rutaPdf, contenido);

    // Cerramos la pestaña del visor de PDF si se abrió una.
    for (const paginaAbierta of contexto.pages()) {
      if (paginaAbierta.url().includes('/eSicol/cc/reporte/ddjjpresentacion.pdf')) {
        await paginaAbierta.close();
      }
    }

    return rutaPdf;
  } catch (error) {
    console.error('No se pudo descargar el PDF de la DDJJ de AGIP', error);
    throw new Error('No se pudo descargar el PDF de la DDJJ de AGIP', { cause: error });
  }
}
