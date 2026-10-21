import type { BrowserContext, Page } from 'playwright';

export async function irAPaginaMisComprobantes(contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const [paginaMisComprobantes] = await Promise.all([
      contexto.waitForEvent('page'),
      pagina.getByRole('heading', { name: 'MIS COMPROBANTES' }).click(),
    ]);

    await paginaMisComprobantes.bringToFront();

    await paginaMisComprobantes.waitForLoadState('domcontentloaded');

    await paginaMisComprobantes.locator('#titulo', { hasText: 'Mis Comprobantes' }).waitFor({
      state: 'visible',
    });

    console.log('Mis Comprobantes abierto');

    return paginaMisComprobantes;
  } catch (error) {
    console.error('No se pudo abrir Mis Comprobantes', error);
    throw new Error('No se pudo abrir Mis Comprobantes', { cause: error });
  }
}
