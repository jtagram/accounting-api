import type { Page } from 'playwright';

export async function irAPaginaPresentacionesDdjj(pagina: Page): Promise<void> {
  try {
    await pagina.bringToFront();

    await pagina.getByRole('heading', { name: 'Presentaciones' }).waitFor({ state: 'visible' });

    await pagina.locator('#menuConsultaDDJJ-link').click();

    console.log('Consulta de DDJJ presentadas abierto');
  } catch (error) {
    console.error('No se pudo abrir Consulta de DDJJ presentadas', error);
    throw new Error('No se pudo abrir Consulta de DDJJ presentadas', { cause: error });
  }
}
