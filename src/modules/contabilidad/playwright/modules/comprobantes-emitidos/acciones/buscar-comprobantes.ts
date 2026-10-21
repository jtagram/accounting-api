import type { Page } from 'playwright';

export async function buscarComprobantes(pagina: Page): Promise<void> {
  try {
    await pagina.locator('#buscarComprobantes').click();

    console.log('Búsqueda de comprobantes ejecutada');
  } catch (error) {
    console.error('No se pudo buscar los comprobantes', error);
    throw new Error('No se pudo buscar los comprobantes', { cause: error });
  }
}
