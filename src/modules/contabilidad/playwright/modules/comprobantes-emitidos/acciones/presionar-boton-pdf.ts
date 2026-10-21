import type { Page } from 'playwright';

export async function presionarBotonPdf(pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('button', { name: 'PDF' }).click();

    console.log('Botón PDF presionado');
  } catch (error) {
    console.error('No se pudo presionar el botón PDF', error);
    throw new Error('No se pudo presionar el botón PDF', { cause: error });
  }
}
