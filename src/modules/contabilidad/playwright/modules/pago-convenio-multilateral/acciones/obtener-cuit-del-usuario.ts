import type { Page } from 'playwright';

export async function obtenerCuitDelUsuario(pagina: Page): Promise<string> {
  try {
    return (await pagina.locator('#usernav .numeroCuit').innerText())
      .trim()
      .replace(/-/g, '')
      .replace(/[[\]]/g, '');
  } catch (error) {
    console.error('No se pudo obtener el CUIT del usuario', error);
    throw new Error('No se pudo obtener el CUIT del usuario', { cause: error });
  }
}
