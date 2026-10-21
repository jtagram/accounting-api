import type { Page } from 'playwright';

export async function esperarResultadosDeBusqueda(pagina: Page): Promise<void> {
  try {
    await pagina.waitForLoadState('networkidle');

    console.log('Resultados de la búsqueda cargados');
  } catch (error) {
    console.error('No se pudieron cargar los resultados de la búsqueda', error);
    throw new Error('No se pudieron cargar los resultados de la búsqueda', { cause: error });
  }
}
