import type { Page } from 'playwright';
import type { CriterioDeBusqueda } from './obtener-criterio-de-busqueda.js';

// Devuelve el índice de la fila de la DDJJ mensual del anticipo buscado,
// creada en el mes actual, o null si no existe.
export async function buscarFilaDeLaDdjj(pagina: Page, criterio: CriterioDeBusqueda): Promise<number | null> {
  try {
    const filas = pagina.locator('#tableMensualDj tbody tr');
    const cantidad = await filas.count();

    for (let i = 0; i < cantidad; i++) {
      const fila = filas.nth(i);

      const anticipoTexto = (await fila.locator('td').nth(1).innerText()).trim();
      const fechaCreacionTexto = (await fila.locator('td').nth(3).innerText()).trim();

      const anticipoYYYYMM = (anticipoTexto.split(' - ')[0] ?? '').trim();
      const [, mesTexto, anioTexto] = fechaCreacionTexto.split('/');

      const esMesActual = Number(mesTexto) === criterio.mesActual && Number(anioTexto) === criterio.anioActual;
      const esAnticipoMesPasado = anticipoYYYYMM === criterio.anticipoBuscado;

      if (esMesActual && esAnticipoMesPasado) {
        return i;
      }
    }

    return null;
  } catch (error) {
    console.error('No se pudo buscar la fila de la DDJJ mensual', error);
    throw new Error('No se pudo buscar la fila de la DDJJ mensual', { cause: error });
  }
}
