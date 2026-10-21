import type { Page } from 'playwright';

export async function seleccionarMesAnterior(pagina: Page): Promise<void> {
  try {
    await pagina.locator('#fechaEmision').click();

    await pagina.locator('li[data-range-key="Mes Pasado"]').click();

    const rangoFechas = await pagina.locator('#fechaEmision').inputValue();

    verificarMesAnterior(rangoFechas);

    console.log('Rango de fechas seleccionado:', rangoFechas);
  } catch (error) {
    console.error('No se pudo seleccionar el mes pasado', error);
    throw new Error('No se pudo seleccionar el mes pasado', { cause: error });
  }
}

function verificarMesAnterior(rangoFechas: string): void {
  const hoy = new Date();
  const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const ultimoDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

  const formatearFecha = (fecha: Date) =>
    `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

  const rangoEsperado = `${formatearFecha(primerDiaMesPasado)} - ${formatearFecha(ultimoDiaMesPasado)}`;

  if (rangoFechas !== rangoEsperado) {
    console.error(`El rango de fechas (${rangoFechas}) no corresponde al mes pasado (${rangoEsperado})`);
    throw new Error(`El rango de fechas (${rangoFechas}) no corresponde al mes pasado (${rangoEsperado})`);
  }
}
