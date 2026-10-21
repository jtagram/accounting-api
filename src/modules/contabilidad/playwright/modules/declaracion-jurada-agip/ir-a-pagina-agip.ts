import type { BrowserContext, Page } from 'playwright';

export async function irAPaginaAGIP(contexto: BrowserContext): Promise<Page> {
  try {
    const paginaAgip = await contexto.newPage();

    await paginaAgip.goto('https://claveciudad.agip.gob.ar/#', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Página de AGIP abierta');

    return paginaAgip;
  } catch (error) {
    console.error('No se pudo abrir AGIP', error);
    throw new Error('No se pudo abrir AGIP', { cause: error });
  }
}
