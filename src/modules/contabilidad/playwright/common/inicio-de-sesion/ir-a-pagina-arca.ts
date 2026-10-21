import type { Page } from 'playwright';

export async function irAPaginaARCA(pagina: Page): Promise<void> {
  try {
    await pagina.goto('https://www.arca.gob.ar/');

    await pagina.getByRole('link', { name: 'Iniciar sesión' }).waitFor({ state: 'visible' });

    console.log('Página de ARCA abierta');
  } catch (error) {
    console.error('No se pudo abrir ARCA', error);
    throw new Error('No se pudo abrir ARCA', { cause: error });
  }
}
