import type { BrowserContext, Page } from 'playwright';

// El botón de imprimir de e-Sicol es un botón ExtJS: el id (button-1079) lo
// genera ExtJS, así que lo buscamos por la clase del ícono.
// Al hacer click se abre el visor de PDF de Chrome con el reporte
// (.../eSicol/cc/reporte/ddjjpresentacion.pdf?action=find&ddjjId=...). Esperamos
// esa respuesta en todo el contexto (sirve si abre en pestaña nueva, en un
// iframe o en la misma) y devolvemos su URL para descargarla después.
export async function imprimirDeclaracionJurada(contexto: BrowserContext, pagina: Page): Promise<string> {
  try {
    const [respuestaPdf] = await Promise.all([
      contexto.waitForEvent('response', {
        predicate: (response) => response.url().includes('/eSicol/cc/reporte/ddjjpresentacion.pdf'),
        timeout: 60000,
      }),
      pagina.locator('.imprimir-ddjj').click(),
    ]);

    console.log('Reporte de DDJJ generado');

    return respuestaPdf.url();
  } catch (error) {
    console.error('No se pudo imprimir la DDJJ', error);
    throw new Error('No se pudo imprimir la DDJJ', { cause: error });
  }
}
