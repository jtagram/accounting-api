import type { Page } from 'playwright';

export async function presionarLinkRetencionesYCoeficientes(pagina: Page): Promise<void> {
  try {
    await pagina.getByRole('link', { name: 'Retenciones y coeficientes' }).click();

    console.log('Link Retenciones y coeficientes presionado');
  } catch (error) {
    console.error('No se pudo presionar el link Retenciones y coeficientes', error);
    throw new Error('No se pudo presionar el link Retenciones y coeficientes', { cause: error });
  }
}
