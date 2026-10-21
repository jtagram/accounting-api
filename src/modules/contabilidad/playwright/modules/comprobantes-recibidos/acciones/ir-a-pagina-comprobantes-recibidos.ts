import type { Page } from 'playwright';

export async function irAPaginaComprobantesRecibidos(pagina: Page): Promise<void> {
  try {
    await pagina.locator('#btnRecibidos').click();

    await pagina.locator('#titulo', { hasText: 'Comprobantes Recibidos' }).waitFor({
      state: 'visible',
    });

    console.log('Comprobantes Recibidos abierto');
  } catch (error) {
    console.error('No se pudo abrir Comprobantes Recibidos', error);
    throw new Error('No se pudo abrir Comprobantes Recibidos', { cause: error });
  }
}
