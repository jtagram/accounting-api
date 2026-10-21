import type { BrowserContext, Page } from 'playwright';
import { irAPaginaServicioComarb } from './ir-a-pagina-servicio-comarb.js';

export async function irAPaginaSifereDdjj(contexto: BrowserContext, pagina: Page, cuit: string): Promise<Page> {
  const paginaDdjj = await irAPaginaServicioComarb(contexto, pagina, 'comarb_sifereweb_ddjj');

  try {
    const selectorCuit = paginaDdjj.locator('select#cuit');
    const cuitSeleccionado = await selectorCuit.inputValue();

    if (cuitSeleccionado !== cuit) {
      throw new Error(`El CUIT seleccionado (${cuitSeleccionado}) no coincide con el esperado (${cuit})`);
    }

    await paginaDdjj.locator('input[value="Seleccionar"]').click();
    await paginaDdjj.waitForLoadState('networkidle');

    // Después de "Seleccionar", el portal a veces pide confirmar el CUIT y a
    // veces va directo al inicio. networkidle no garantiza que renderice, así
    // que esperamos la condición real (lo que aparezca primero) con un timeout
    // generoso, igual que en ir-a-pagina-servicio-comarb.ts para este mismo sitio.
    const botonConfirmar = paginaDdjj.locator('input[value="Si. Confirmar Ingreso al Sistema"]');
    const enlaceListado = paginaDdjj.locator('#INICIO_listado_ddjj_mensuales');

    await botonConfirmar.or(enlaceListado).waitFor({ state: 'visible', timeout: 60000 });

    if (await botonConfirmar.isVisible()) {
      const cuitConfirmado = await paginaDdjj.locator('input[name="cuit"][readonly]').inputValue();

      if (cuitConfirmado !== cuit) {
        throw new Error(`El CUIT a confirmar (${cuitConfirmado}) no coincide con el esperado (${cuit})`);
      }

      await botonConfirmar.click();
      await paginaDdjj.waitForLoadState('networkidle');
    }

    await enlaceListado.click();
    await paginaDdjj.waitForLoadState('networkidle');

    await paginaDdjj.locator('#tableMensualDj tbody tr').first().waitFor({ state: 'visible' });

    console.log('Listado de DDJJ mensuales abierto');

    return paginaDdjj;
  } catch (error) {
    console.error('No se pudo abrir el listado de DDJJ mensuales', error);
    await paginaDdjj.close();
    throw new Error('No se pudo abrir el listado de DDJJ mensuales', { cause: error });
  }
}
