import type { BrowserContext, Page } from 'playwright';

export async function irAPaginaDdjjYPagos(contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [paginaDdjj] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.locator('a[title="setidj"]').click(),
    ]);

    await paginaDdjj.bringToFront();

    await paginaDdjj.waitForLoadState('domcontentloaded');

    // El modal de "Novedades del servicio" solo aparece la primera vez (o si
    // no se tildó "No volver a mostrar"), así que lo cerramos solo si sale.
    const botonEntendido = paginaDdjj.getByRole('button', { name: 'Entendido' });

    if (await botonEntendido.isVisible({ timeout: 5000 }).catch(() => false)) {
      await botonEntendido.click();
    }

    console.log('Presentación de DDJJ y Pagos abierto');

    return paginaDdjj;
  } catch (error) {
    console.error('No se pudo abrir Presentación de DDJJ y Pagos', error);
    throw new Error('No se pudo abrir Presentación de DDJJ y Pagos', { cause: error });
  }
}
