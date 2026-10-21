import type { Page } from 'playwright';
import { localizarIconoDetalle } from './localizar-fila-del-periodo.js';

export async function abrirDetalleDelPeriodo(pagina: Page, periodo: string): Promise<void> {
  try {
    await localizarIconoDetalle(pagina, periodo).click();

    console.log(`Detalle abierto para el período ${periodo}`);
  } catch (error) {
    console.error(`No se pudo abrir el detalle del período ${periodo}`, error);
    throw new Error(`No se pudo abrir el detalle del período ${periodo}`, { cause: error });
  }
}
