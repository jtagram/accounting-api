import type { BrowserContext, Page } from 'playwright';
import { irAPaginaServicioComarb } from './ir-a-pagina-servicio-comarb.js';

export async function irAPaginaConsultasSifere(contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const enlaceSifereWebConsultas = pagina.locator('a[title="comarb_sifereweb_consultas"]');
    const usaSifereWebConsultas = await enlaceSifereWebConsultas.isVisible();
    const nombreServicio = usaSifereWebConsultas ? 'comarb_sifereweb_consultas' : 'comarb_sircreb_contrib';

    return await irAPaginaServicioComarb(contexto, pagina, nombreServicio);
  } catch (error) {
    console.error('No se pudo abrir Consultas SIFERE', error);
    throw new Error('No se pudo abrir Consultas SIFERE', { cause: error });
  }
}
