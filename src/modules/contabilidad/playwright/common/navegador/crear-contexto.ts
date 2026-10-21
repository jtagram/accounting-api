import type { Browser, BrowserContext } from 'playwright';

// Corriendo con ventana, el navegador usa el idioma y la hora de la PC y se identifica como un Chrome común.
// En el servidor, oculto y dentro de un contenedor, sería "HeadlessChrome", en inglés y en UTC. Se crea el
// contexto con el mismo user-agent sin esa marca, en español y con la hora de Argentina, para que los
// portales vean lo mismo que cuando la automatización se corría en una PC.
export async function crearContexto(navegador: Browser): Promise<BrowserContext> {
  const contextoTemporal = await navegador.newContext();
  const paginaTemporal = await contextoTemporal.newPage();
  const userAgent = (await paginaTemporal.evaluate<string>('navigator.userAgent')).replace('HeadlessChrome', 'Chrome');
  await contextoTemporal.close();

  return navegador.newContext({
    userAgent,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  });
}
