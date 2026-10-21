import type { Page } from 'playwright';

export async function iniciarSesionArca(pagina: Page, usuario: string, clave: string): Promise<string> {
  await pagina.goto('https://auth.afip.gob.ar/contribuyente_/login.xhtml');

  await pagina.locator('[id="F1:username"]').fill(usuario);

  await pagina.locator('[id="F1:btnSiguiente"]').click();

  await pagina.locator('[id="F1:password"]').fill(clave);

  await pagina.locator('[id="F1:btnIngresar"]').click();

  const nombre = await confirmarInicioDeSesion(pagina, usuario);

  if (nombre) return nombre;

  await verificarErrorDeInicioDeSesion(pagina);

  throw new Error('No se pudo confirmar el login');
}

async function confirmarInicioDeSesion(pagina: Page, usuario: string): Promise<string | null> {
  try {
    const localizadorNombre = pagina.locator('#usernav strong.text-primary');
    const localizadorCuit = pagina.locator('#usernav .numeroCuit');

    await localizadorNombre.waitFor({ state: 'visible' });

    const nombre = (await localizadorNombre.innerText()).trim();
    const cuit = (await localizadorCuit.innerText()).trim().replace(/-/g, '').replace(/[\[\]]/g, '');

    if (cuit !== usuario) {
      throw new Error(`El CUIT logueado (${cuit}) no coincide con el usuario (${usuario})`);
    }

    console.log('Login exitoso');
    console.log("Nombre: ", nombre);
    console.log("CUIT: ", cuit);
    return nombre;
  } catch (error) {
    console.error('No se pudo confirmar el login', error);
    return null;
  }

}

async function verificarErrorDeInicioDeSesion(pagina: Page): Promise<void> {
  const mensajeError = pagina.locator('#F1\\:msg');
  if (await mensajeError.isVisible({ timeout: 5000 }).catch(() => false)) {
    const texto = await mensajeError.innerText();
    
    if (texto.trim() === 'Clave o usuario incorrecto') {
      console.error('Clave o usuario incorrecto');
      throw new Error('Clave o usuario incorrecto');
    }

    throw new Error('Error de login desconocido: ' + texto);
  }
}

