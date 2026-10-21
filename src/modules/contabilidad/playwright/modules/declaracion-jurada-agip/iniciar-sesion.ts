import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';

export async function iniciarSesion(logger: Logger, pagina: Page, cuit: string, clave: string): Promise<void> {
  try {
    // Por defecto se muestra el login con miBA; el link "Clave Ciudad"
    // (toggleLogin) cambia al formulario de Clave Ciudad.
    await pagina.locator('.clave-ciudad-info').getByRole('link', { name: 'Clave Ciudad' }).click();

    // El input solo acepta 11 dígitos (sin guiones).
    await pagina.locator('#cuit').fill(cuit.replace(/\D/g, ''));

    await pagina.locator('#clave').fill(clave);

    // "Ingresar" hace document.frm.submit(), que recarga la página.
    await pagina.locator('.form-Login').getByRole('button', { name: 'Ingresar' }).click();

    await verificarInicioSesion(logger, pagina, cuit);

    logger.log({ cuit, msg: 'Sesión iniciada en AGIP (Clave Ciudad)' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), cuit, msg: 'No se pudo iniciar sesión en AGIP' });
    throw new Error('No se pudo iniciar sesión en AGIP', { cause: error });
  }
}

// Ya logueado, la cabecera muestra "Portal del Contribuyente" y al lado la
// razón social con el CUIT entre paréntesis, ej. "CALLE OCHOA OCTAVIO (20-94170272-5)".
async function verificarInicioSesion(logger: Logger, pagina: Page, cuit: string): Promise<void> {
  try {
    await pagina
      .locator('.navbar-header')
      .getByRole('link', { name: 'Portal del Contribuyente' })
      .waitFor({ state: 'visible', timeout: 60000 });

    const cuitYRazon = (await pagina.locator('.cuityrazon span').innerText()).trim();

    const cuitLogueado = (cuitYRazon.match(/\(([\d-]+)\)\s*$/)?.[1] ?? '').replace(/-/g, '');

    if (cuitLogueado !== cuit.replace(/\D/g, '')) {
      throw new Error(`El CUIT logueado (${cuitYRazon}) no coincide con el CUIT esperado (${cuit})`);
    }

    logger.log({ cuit: cuitLogueado, msg: 'Inicio de sesión en AGIP verificado' });
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), cuit, msg: 'No se pudo verificar el inicio de sesión en AGIP' });
    throw error;
  }
}
