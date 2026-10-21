import type { Locator, Page } from 'playwright';

export function localizarFilaDelPeriodo(pagina: Page, periodo: string): Locator {
  return pagina.locator('#inclusion tr').filter({ hasText: periodo });
}

export function localizarIconoDetalle(pagina: Page, periodo: string): Locator {
  return localizarFilaDelPeriodo(pagina, periodo).locator('img[title="Ver Retenciones y Coeficientes"]');
}
