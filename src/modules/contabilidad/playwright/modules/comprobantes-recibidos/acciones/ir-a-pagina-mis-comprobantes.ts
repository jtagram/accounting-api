import type { BrowserContext, Page } from 'playwright';

export async function irAPaginaMisComprobantes(contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [myReceiptsPage] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.getByRole('heading', { name: 'MIS COMPROBANTES' }).click(),
    ]);

    await myReceiptsPage.bringToFront();

    await myReceiptsPage.waitForLoadState('domcontentloaded');

    await myReceiptsPage.locator('#titulo', { hasText: 'Mis Comprobantes' }).waitFor({
      state: 'visible',
    });

    console.log('Mis Comprobantes abierto');

    return myReceiptsPage;
  } catch (error) {
    console.error('No se pudo abrir Mis Comprobantes', error);
    throw new Error('No se pudo abrir Mis Comprobantes', { cause: error });
  }
}
