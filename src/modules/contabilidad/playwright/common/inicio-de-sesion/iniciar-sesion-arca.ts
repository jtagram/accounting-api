import type { Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../errores/construir-error-para-log.js';

export async function iniciarSesionArca(logger: Logger, pagina: Page, usuario: string, clave: string): Promise<string> {
  try {
    await pagina.goto('https://auth.afip.gob.ar/contribuyente_/login.xhtml');

    await pagina.locator('[id="F1:username"]').fill(usuario);

    await pagina.locator('[id="F1:btnSiguiente"]').click();

    await pagina.locator('[id="F1:password"]').fill(clave);

    await pagina.locator('[id="F1:btnIngresar"]').click();

    const nombre = await confirmarInicioDeSesion(logger, pagina, usuario);

    if (nombre) return nombre;

    await verificarErrorDeInicioDeSesion(logger, pagina);

    throw new Error('No se pudo confirmar el login');
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo iniciar sesión en ARCA' });
    throw error;
  }
}

async function confirmarInicioDeSesion(logger: Logger, pagina: Page, usuario: string): Promise<string | null> {
  try {
    const localizadorNombre = pagina.locator('#usernav strong.text-primary');
    const localizadorCuit = pagina.locator('#usernav .numeroCuit');

    await localizadorNombre.waitFor({ state: 'visible' });

    const nombre = (await localizadorNombre.innerText()).trim();
    const cuit = (await localizadorCuit.innerText()).trim().replace(/-/g, '').replace(/[\[\]]/g, '');

    if (cuit !== usuario) {
      throw new Error(`El CUIT logueado (${cuit}) no coincide con el usuario (${usuario})`);
    }

    logger.log({ nombre, cuit, msg: 'Login exitoso' });
    return nombre;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo confirmar el login' });
    return null;
  }

}

async function verificarErrorDeInicioDeSesion(logger: Logger, pagina: Page): Promise<void> {
  try {
    const mensajeError = pagina.locator('#F1\\:msg');
    if (await mensajeError.isVisible({ timeout: 5000 }).catch(() => false)) {
      const texto = await mensajeError.innerText();

      if (texto.trim() === 'Clave o usuario incorrecto') {
        logger.error({ msg: 'Clave o usuario incorrecto' });
        throw new Error('Clave o usuario incorrecto');
      }

      throw new Error('Error de login desconocido: ' + texto);
    }
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo verificar el error de inicio de sesión' });
    throw error;
  }
}

