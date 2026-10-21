import type { Page } from 'playwright';
import { localizarIconoDetalle } from './localizar-fila-del-periodo.js';

export async function existeDetalleDelPeriodo(pagina: Page, periodo: string): Promise<boolean> {
  try {
    return (await localizarIconoDetalle(pagina, periodo).count()) > 0;
  } catch (error) {
    console.error(`No se pudo verificar si existe el detalle del período ${periodo}`, error);
    throw new Error(`No se pudo verificar si existe el detalle del período ${periodo}`, { cause: error });
  }
}
