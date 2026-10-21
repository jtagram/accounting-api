import type { Page } from 'playwright';

export async function noHayComprobantesEmitidos(pagina: Page): Promise<boolean> {
  const noExisteInformacion = pagina.locator('td.dataTables_empty', {
    hasText: 'No existe información para los filtros ingresados',
  });

  const infoSinRegistros = pagina.locator('#tablaDataTables_info', {
    hasText: 'Mostrando 0 registros de un total de 0',
  });

  const alMenosUnComprobante = pagina.locator('#tablaDataTables tbody tr[role="row"]').first();

  const sinComprobantes = Promise.all([
    noExisteInformacion.waitFor({ state: 'visible' }),
    infoSinRegistros.waitFor({ state: 'visible' }),
  ]).then(() => true as const);

  const conComprobantes = alMenosUnComprobante.waitFor({ state: 'visible' }).then(() => false as const);

  // evita "unhandled rejection" de la promesa que pierde la carrera
  sinComprobantes.catch(() => {});
  conComprobantes.catch(() => {});

  const noHayComprobantes = await Promise.race([sinComprobantes, conComprobantes]);

  if (noHayComprobantes) {
    console.log(await noExisteInformacion.innerText());
    console.log(await infoSinRegistros.innerText());
  }

  return noHayComprobantes;
}
