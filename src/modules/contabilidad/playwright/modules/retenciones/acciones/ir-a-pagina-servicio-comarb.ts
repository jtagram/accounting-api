import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';

// Los servicios de Comisión Arbitral (comarb.gob.ar) se abren con el mismo
// handshake SSO: pedimos el servicio, pedimos la autorización (sign/token),
// posteamos eso contra la URL del servicio y navegamos a donde nos redirija.
// El window.open propio del portal para estos servicios no llega a abrirse
// en este entorno, así que lo hacemos nosotros directo por la API.
export async function irAPaginaServicioComarb(logger: Logger, contexto: BrowserContext, pagina: Page, nombreServicio: string): Promise<Page> {
  try {
    const cuit = (await pagina.locator('#usernav .numeroCuit').innerText())
      .trim()
      .replace(/-/g, '')
      .replace(/[[\]]/g, '');

    const respuestaServicio = await contexto.request.get(
      `https://portalcf.cloud.afip.gob.ar/portal/api/servicios/${cuit}/servicio/${nombreServicio}`,
    );

    if (!respuestaServicio.ok()) {
      throw new Error(`No se pudo obtener el servicio ${nombreServicio}: ${respuestaServicio.status()}`);
    }

    const { servicio } = await respuestaServicio.json();

    const respuestaAutorizacion = await contexto.request.get(
      `https://portalcf.cloud.afip.gob.ar/portal/api/servicios/${cuit}/servicio/${nombreServicio}/autorizacion`,
    );

    if (!respuestaAutorizacion.ok()) {
      throw new Error(`No se pudo obtener la autorización para ${nombreServicio}: ${respuestaAutorizacion.status()}`);
    }

    const { sign, token } = await respuestaAutorizacion.json();

    const respuestaSso = await contexto.request.post(servicio.url, {
      form: { sign, token },
      maxRedirects: 0,
    });

    const paginaServicio = await contexto.newPage();

    if (respuestaSso.status() === 302 || respuestaSso.status() === 303) {
      const urlRedireccion = respuestaSso.headers()['location'];

      if (!urlRedireccion) {
        throw new Error('El POST de autenticación SSO no devolvió una URL de redirección');
      }

      // El redirect legado a veces apunta a http:// (sin TLS), que se cuelga
      // sin respuesta en esta red; https:// al mismo host/path funciona.
      const urlRedireccionSegura = urlRedireccion.replace(/^http:\/\//, 'https://');

      await paginaServicio.goto(urlRedireccionSegura, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } else if (respuestaSso.ok()) {
      // Algunos servicios (ej. comarb_sifereweb_ddjj) no redirigen: el POST
      // ya devuelve directamente la página autenticada en el body. Pedirla
      // de nuevo con un GET sin el sign/token la rompe ("No se ha recibido
      // Token"), así que en vez de repetir la petición le servimos a
      // Playwright la respuesta que ya tenemos para esa navegación puntual,
      // preservando la URL/origen reales para que la sesión funcione bien.
      const cuerpo = await respuestaSso.body();
      const tipoContenido = respuestaSso.headers()['content-type'] ?? 'text/html; charset=utf-8';

      await paginaServicio.route(servicio.url, async (route) => {
        await route.fulfill({ status: 200, headers: { 'content-type': tipoContenido }, body: cuerpo });
        await paginaServicio.unroute(servicio.url);
      });

      await paginaServicio.goto(servicio.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } else {
      throw new Error(`Respuesta inesperada del POST de autenticación SSO: ${respuestaSso.status()}`);
    }

    logger.log({ cuit, nombreServicio, msg: `${nombreServicio} abierto (autenticación directa vía SSO)` });

    return paginaServicio;
  } catch (error) {
    logger.error({
      err: construirErrorParaLog(error),
      nombreServicio,
      msg: `No se pudo abrir el servicio ${nombreServicio}`,
    });
    throw new Error(`No se pudo abrir el servicio ${nombreServicio}`, { cause: error });
  }
}
