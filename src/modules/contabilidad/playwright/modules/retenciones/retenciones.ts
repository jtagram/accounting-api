import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Download, Locator, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

@Injectable()
export class Retenciones {
  constructor(private readonly logger: Logger) {}

  async obtenerRetenciones(contexto: BrowserContext, pagina: Page): Promise<string> {
    this.logger.log({ msg: 'Obteniendo retenciones' });

    let paginaConsultasSifere: Page | undefined;

    try {
      paginaConsultasSifere = await this.irAPaginaConsultasSifere(contexto, pagina);

      await this.irAPaginaInclusionesYRetenciones(paginaConsultasSifere);

      await this.buscarRetenciones(paginaConsultasSifere);

      await this.esperarResultadosDeBusqueda(paginaConsultasSifere);

      const periodo = this.obtenerPeriodoMesPasado();

      if (!(await this.existeFilaDelPeriodo(paginaConsultasSifere, periodo))) {
        return await this.guardarTxt('retenciones-no-tiene.txt', `El usuario no tiene retenciones: no existe el período ${periodo}`);
      }

      if (!(await this.existeDetalleDelPeriodo(paginaConsultasSifere, periodo))) {
        return await this.guardarTxt('retenciones-no-tiene.txt', `El usuario no tiene retenciones: no existe el detalle para ${periodo}`);
      }

      await this.abrirDetalleDelPeriodo(paginaConsultasSifere, periodo);

      const promesaDescarga = paginaConsultasSifere.waitForEvent('download');

      await this.presionarLinkRetencionesYCoeficientes(paginaConsultasSifere);

      const descarga = await promesaDescarga;

      const ruta = await this.guardarPdf(descarga);

      this.logger.log({ periodo, msg: 'Retenciones descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudieron obtener las retenciones' });
      return await this.guardarTxt('retenciones-error.txt', formatearError(error));
    } finally {
      await paginaConsultasSifere?.close().catch(() => undefined);
    }
  }

  private async irAPaginaConsultasSifere(contexto: BrowserContext, pagina: Page): Promise<Page> {
    try {
      const enlaceSifereWebConsultas = pagina.locator('a[title="comarb_sifereweb_consultas"]');
      const usaSifereWebConsultas = await enlaceSifereWebConsultas.isVisible();
      const nombreServicio = usaSifereWebConsultas ? 'comarb_sifereweb_consultas' : 'comarb_sircreb_contrib';

      const paginaConsultasSifere = await this.irAPaginaServicioComarb(contexto, pagina, nombreServicio);

      this.logger.log({ nombreServicio, msg: 'Consultas SIFERE abierto' });

      return paginaConsultasSifere;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Consultas SIFERE' });
      throw new Error('No se pudo abrir Consultas SIFERE', { cause: error });
    }
  }

  private async irAPaginaServicioComarb(contexto: BrowserContext, pagina: Page, nombreServicio: string): Promise<Page> {
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

        const urlRedireccionSegura = urlRedireccion.replace(/^http:\/\//, 'https://');

        await paginaServicio.goto(urlRedireccionSegura, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } else if (respuestaSso.ok()) {
        const cuerpo = await respuestaSso.body();
        const tipoContenido = respuestaSso.headers()['content-type'] ?? 'text/html; charset=utf-8';

        await paginaServicio.route(servicio.url, async (route) => {
          await route.fulfill({ status: 200, headers: { 'content-type': tipoContenido }, body: cuerpo });
          await paginaServicio.unroute(servicio.url);
        });

        await paginaServicio.goto(servicio.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } else {
        const detalle = (await respuestaSso.text()).slice(0, 500);

        this.logger.error({
          nombreServicio,
          estado: respuestaSso.status(),
          tipoContenido: respuestaSso.headers()['content-type'],
          detalle,
          msg: 'Respuesta inesperada del POST de autenticación SSO',
        });

        throw new Error(`Respuesta inesperada del POST de autenticación SSO: ${respuestaSso.status()}. Respuesta: ${detalle}`);
      }

      this.logger.log({ cuit, nombreServicio, msg: `${nombreServicio} abierto (autenticación directa vía SSO)` });

      return paginaServicio;
    } catch (error) {
      this.logger.error({ err: error, nombreServicio, msg: `No se pudo abrir el servicio ${nombreServicio}` });
      throw new Error(`No se pudo abrir el servicio ${nombreServicio}`, { cause: error });
    }
  }

  private async irAPaginaInclusionesYRetenciones(pagina: Page): Promise<void> {
    try {
      await pagina.bringToFront();

      await pagina.waitForLoadState('domcontentloaded');

      await pagina.getByRole('heading', { name: 'DEDUCCIONES' }).hover();

      await pagina
        .locator('a[href="srbPadron.do?method=buscarIn"]', { hasText: 'Inclusiones y Retenciones' })
        .click();

      this.logger.log({ msg: 'Inclusiones y Retenciones abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Inclusiones y Retenciones' });
      throw new Error('No se pudo abrir Inclusiones y Retenciones', { cause: error });
    }
  }

  private async buscarRetenciones(pagina: Page): Promise<void> {
    try {
      await pagina.getByRole('button', { name: 'Buscar' }).click();

      this.logger.log({ msg: 'Búsqueda de retenciones ejecutada' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo buscar las retenciones' });
      throw new Error('No se pudo buscar las retenciones', { cause: error });
    }
  }

  private async esperarResultadosDeBusqueda(pagina: Page): Promise<void> {
    try {
      await pagina.waitForLoadState('networkidle');

      this.logger.log({ msg: 'Resultados de la búsqueda cargados' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudieron cargar los resultados de la búsqueda' });
      throw new Error('No se pudieron cargar los resultados de la búsqueda', { cause: error });
    }
  }

  private obtenerPeriodoMesPasado(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);

    const mesPasado = String(fecha.getMonth() + 1).padStart(2, '0');
    const anioPasado = fecha.getFullYear();

    const periodo = `${mesPasado}/${anioPasado}`;

    this.logger.log({ periodo, msg: 'Período a buscar' });

    return periodo;
  }

  private async existeFilaDelPeriodo(pagina: Page, periodo: string): Promise<boolean> {
    try {
      const existe = (await this.localizarFilaDelPeriodo(pagina, periodo).count()) > 0;

      this.logger.log({ periodo, existe, msg: 'Fila del período verificada' });

      return existe;
    } catch (error) {
      this.logger.error({ err: error, periodo, msg: `No se pudo verificar si existe el período ${periodo}` });
      throw new Error(`No se pudo verificar si existe el período ${periodo}`, { cause: error });
    }
  }

  private async existeDetalleDelPeriodo(pagina: Page, periodo: string): Promise<boolean> {
    try {
      const existe = (await this.localizarIconoDetalle(pagina, periodo).count()) > 0;

      this.logger.log({ periodo, existe, msg: 'Detalle del período verificado' });

      return existe;
    } catch (error) {
      this.logger.error({ err: error, periodo, msg: `No se pudo verificar si existe el detalle del período ${periodo}` });
      throw new Error(`No se pudo verificar si existe el detalle del período ${periodo}`, { cause: error });
    }
  }

  private async abrirDetalleDelPeriodo(pagina: Page, periodo: string): Promise<void> {
    try {
      await this.localizarIconoDetalle(pagina, periodo).click();

      this.logger.log({ periodo, msg: 'Detalle abierto para el período' });
    } catch (error) {
      this.logger.error({ err: error, periodo, msg: `No se pudo abrir el detalle del período ${periodo}` });
      throw new Error(`No se pudo abrir el detalle del período ${periodo}`, { cause: error });
    }
  }

  private async presionarLinkRetencionesYCoeficientes(pagina: Page): Promise<void> {
    try {
      await pagina.getByRole('link', { name: 'Retenciones y coeficientes' }).click();

      this.logger.log({ msg: 'Link Retenciones y coeficientes presionado' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo presionar el link Retenciones y coeficientes' });
      throw new Error('No se pudo presionar el link Retenciones y coeficientes', { cause: error });
    }
  }

  private localizarFilaDelPeriodo(pagina: Page, periodo: string): Locator {
    return pagina.locator('#inclusion tr').filter({ hasText: periodo });
  }

  private localizarIconoDetalle(pagina: Page, periodo: string): Locator {
    return this.localizarFilaDelPeriodo(pagina, periodo).locator('img[title="Ver Retenciones y Coeficientes"]');
  }

  private async guardarPdf(descarga: Download): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), 'retenciones.pdf');

    await descarga.saveAs(ruta);

    return ruta;
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'retenciones-'));
  }
}
