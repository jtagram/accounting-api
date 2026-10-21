import type { Page } from 'playwright';

export async function irAPaginaComprobantesEmitidos(pagina: Page): Promise<void> {
  try {
    await pagina.locator('#btnEmitidos').click();

    await pagina.locator('#titulo', { hasText: 'Comprobantes Emitidos' }).waitFor({
      state: 'visible',
    });

    console.log('Comprobantes Emitidos abierto');
  } catch (error) {
    console.error('No se pudo abrir Comprobantes Emitidos', error);
    throw new Error('No se pudo abrir Comprobantes Emitidos', { cause: error });
  }
}
