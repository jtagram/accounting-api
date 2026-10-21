import type { Page } from 'playwright';

export async function irAPaginaMisServicios(pagina: Page): Promise<void> {
  try {
    await pagina.locator('a[href="/portal/app/mis-servicios"]').click();

    await pagina.getByRole('heading', { level: 3, name: 'Mis servicios', exact: true }).waitFor({ state: 'visible' });

    await pagina.waitForLoadState('networkidle');

    console.log('Mis servicios abierto');
  } catch (error) {
    console.error('No se pudo abrir Mis servicios', error);
    throw new Error('No se pudo abrir Mis servicios', { cause: error });
  }
}
