import type { Page } from 'playwright';

export async function presionarReporteDeDj(pagina: Page, indiceFila: number): Promise<void> {
  try {
    await pagina.locator('#tableMensualDj tbody tr').nth(indiceFila).locator('a[title="Reporte de DJ"]').click();

    console.log('Reporte de DJ presionado');
  } catch (error) {
    console.error('No se pudo presionar el Reporte de DJ', error);
    throw new Error('No se pudo presionar el Reporte de DJ', { cause: error });
  }
}
