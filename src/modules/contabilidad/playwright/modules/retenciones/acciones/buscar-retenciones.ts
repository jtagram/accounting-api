import type { Page } from 'playwright';

export async function buscarRetenciones(pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('button', { name: 'Buscar' }).click();

    console.log('Búsqueda de retenciones ejecutada');
  } catch (error) {
    console.error('No se pudo buscar las retenciones', error);
    throw new Error('No se pudo buscar las retenciones', { cause: error });
  }
}
