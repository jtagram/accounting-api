import type { LaunchOptions } from 'playwright';

export function obtenerOpcionesDeLanzamiento(): LaunchOptions {
  return {
    // Oculto por defecto (servidor); PLAYWRIGHT_HEADLESS=false lo muestra para depurar en local.
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    slowMo: 100,
  };
}
