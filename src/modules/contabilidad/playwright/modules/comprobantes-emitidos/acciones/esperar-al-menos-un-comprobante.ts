import type { Page } from 'playwright';

export async function esperarAlMenosUnComprobante(pagina: Page): Promise<void> {
  await pagina.locator('#tablaDataTables tbody tr[role="row"]').first().waitFor({
    state: 'visible',
  });
}
