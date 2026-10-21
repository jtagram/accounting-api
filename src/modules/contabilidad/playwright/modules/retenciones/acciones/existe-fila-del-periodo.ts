import type { Page } from 'playwright';
import { localizarFilaDelPeriodo } from './localizar-fila-del-periodo.js';

export async function existeFilaDelPeriodo(pagina: Page, periodo: string): Promise<boolean> {
  try {
    return (await localizarFilaDelPeriodo(pagina, periodo).count()) > 0;
  } catch (error) {
    console.error(`No se pudo verificar si existe el período ${periodo}`, error);
    throw new Error(`No se pudo verificar si existe el período ${periodo}`, { cause: error });
  }
}
