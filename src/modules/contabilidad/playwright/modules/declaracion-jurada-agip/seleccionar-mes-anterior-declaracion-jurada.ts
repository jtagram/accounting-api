import type { Page } from 'playwright';

// Cada fila de la grilla de e-Sicol tiene: [ícono, estado, período (YYYY-MM),
// fecha, fecha, tipo]. Buscamos la DDJJ presentada cuyo período es el mes pasado.
export async function seleccionarMesAnteriorDeclaracionJurada(pagina: Page): Promise<boolean> {
  try {
    const mesPasadoFecha = new Date();
    mesPasadoFecha.setDate(1);
    mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
    const periodoBuscado = `${mesPasadoFecha.getFullYear()}-${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Período de DDJJ a buscar en e-Sicol: ${periodoBuscado}`);

    const filaMesPasado = pagina
      .locator('tr.x-grid-row')
      .filter({ has: pagina.locator('td:nth-child(2)', { hasText: /^\s*Presentada\s*$/ }) })
      .filter({ has: pagina.locator('td:nth-child(3)', { hasText: new RegExp(`^\\s*${periodoBuscado}\\s*$`) }) })
      .first();

    if ((await filaMesPasado.count()) === 0) {
      console.log(`No se encontró una DDJJ presentada para el período ${periodoBuscado}`);
      return false;
    }

    await filaMesPasado.click();

    console.log(`DDJJ del período ${periodoBuscado} seleccionada`);

    return true;
  } catch (error) {
    console.error('No se pudo seleccionar la DDJJ del mes pasado', error);
    throw new Error('No se pudo seleccionar la DDJJ del mes pasado', { cause: error });
  }
}
