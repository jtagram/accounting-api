import type { Page } from 'playwright';

export async function irAPaginaInclusionesYRetenciones(pagina: Page): Promise<void> {
  try {
    await pagina.bringToFront();

    await pagina.waitForLoadState('domcontentloaded');

    await pagina.getByRole('heading', { name: 'DEDUCCIONES' }).hover();

    await pagina
      .locator('a[href="srbPadron.do?method=buscarIn"]', { hasText: 'Inclusiones y Retenciones' })
      .click();

    console.log('Inclusiones y Retenciones abierto');
  } catch (error) {
    console.error('No se pudo abrir Inclusiones y Retenciones', error);
    throw new Error('No se pudo abrir Inclusiones y Retenciones', { cause: error });
  }
}
