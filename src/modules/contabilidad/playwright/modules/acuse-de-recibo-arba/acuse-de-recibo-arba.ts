import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Locator, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

@Injectable()
export class AcuseDeReciboArba {
  constructor(private readonly logger: Logger) {}

  async obtenerAcuseDeReciboArba(contexto: BrowserContext, cuit: string, claveCit: string): Promise<string> {
    this.logger.log({ cuit, msg: 'Obteniendo acuse de recibo de ARBA' });

    let paginaArba: Page | undefined;
    let paginaDeclaracionesJuradas: Page | undefined;

    try {
      paginaArba = await this.irAPaginaArba(contexto);

      await this.irAPaginaLogin(paginaArba);

      await this.ingresarCuit(paginaArba, cuit);

      await this.ingresarClaveCit(paginaArba, cuit, claveCit);

      await this.clickIngresar(paginaArba, cuit);

      await this.verificarInicioSesion(paginaArba, cuit);

      await this.irAGestionar(paginaArba);

      await this.verificarCuitGestionar(paginaArba, cuit);

      await this.abrirAccesosFrecuentes(paginaArba);

      paginaDeclaracionesJuradas = await this.irAPresentacionDeclaracionesJuradas(contexto, paginaArba);

      await this.abrirReimpresion(paginaDeclaracionesJuradas);

      await this.irAConstanciaAnticipo(paginaDeclaracionesJuradas);

      await this.abrirPestaniaPorCriteriosVarios(paginaDeclaracionesJuradas);

      await this.seleccionarMesDesde(paginaDeclaracionesJuradas);

      await this.seleccionarMesHasta(paginaDeclaracionesJuradas);

      await this.buscarDeclaracionesJuradas(paginaDeclaracionesJuradas);

      const encontrada = await this.existeDeclaracionJuradaMensual(paginaDeclaracionesJuradas);

      if (!encontrada) {
        return await this.guardarTxt(
          'acuse-de-recibo-arba-no-tiene.txt',
          `El usuario no tiene acuse de recibo de ARBA: no se encontró una DDJJ mensual para el período ${this.obtenerMesAnterior()}`,
        );
      }

      await this.clickEditarDeclaracionJurada(paginaDeclaracionesJuradas);

      await this.aceptarDialogo(paginaDeclaracionesJuradas);

      const urlPdf = await this.reimprimirConstancia(contexto, paginaDeclaracionesJuradas);

      const ruta = await this.descargarPdfConstancia(contexto, urlPdf);

      this.logger.log({ cuit, msg: 'Acuse de recibo de ARBA descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo obtener el acuse de recibo de ARBA' });
      return await this.guardarTxt('acuse-de-recibo-arba-error.txt', formatearError(error));
    } finally {
      await paginaDeclaracionesJuradas?.close().catch(() => undefined);
      await paginaArba?.close().catch(() => undefined);
    }
  }

  private async irAPaginaArba(contexto: BrowserContext): Promise<Page> {
    try {
      const paginaArba = await contexto.newPage();

      await paginaArba.goto('https://web.arba.gov.ar/', { waitUntil: 'domcontentloaded', timeout: 60000 });

      this.logger.log({ msg: 'Página de ARBA abierta' });

      return paginaArba;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir ARBA' });
      throw new Error('No se pudo abrir ARBA', { cause: error });
    }
  }

  private async irAPaginaLogin(pagina: Page): Promise<void> {
    try {
      await pagina.goto(
        'https://sso.arba.gov.ar/Login/login?service=https%3A//www.arba.gov.ar/Gestionar/PanelAutogestion.asp',
        { waitUntil: 'domcontentloaded', timeout: 60000 },
      );

      this.logger.log({ msg: 'Página de login de ARBA abierta' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir el login de ARBA' });
      throw new Error('No se pudo abrir el login de ARBA', { cause: error });
    }
  }

  private async ingresarCuit(pagina: Page, cuit: string): Promise<void> {
    try {
      await pagina.locator('#CUIT').fill(cuit.replace(/\D/g, ''));

      this.logger.log({ cuit, msg: 'CUIT ingresado en el login de ARBA' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo ingresar el CUIT en ARBA' });
      throw new Error('No se pudo ingresar el CUIT en ARBA', { cause: error });
    }
  }

  private async ingresarClaveCit(pagina: Page, cuit: string, claveCit: string): Promise<void> {
    try {
      await pagina.locator('#clave_Cuit').fill(claveCit);

      this.logger.log({ cuit, msg: 'Clave CIT ingresada en el login de ARBA' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo ingresar la clave CIT en ARBA' });
      throw new Error('No se pudo ingresar la clave CIT en ARBA', { cause: error });
    }
  }

  private async clickIngresar(pagina: Page, cuit: string): Promise<void> {
    try {
      await pagina.getByRole('button', { name: 'Ingresar' }).click();

      this.logger.log({ cuit, msg: 'Click en Ingresar en el login de ARBA' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo hacer click en Ingresar en ARBA' });
      throw new Error('No se pudo hacer click en Ingresar en ARBA', { cause: error });
    }
  }

  private async verificarInicioSesion(pagina: Page, cuit: string): Promise<void> {
    try {
      await pagina.getByRole('link', { name: 'Ingresá', exact: true }).waitFor({ state: 'visible', timeout: 60000 });

      this.logger.log({ cuit, msg: 'Inicio de sesión en ARBA verificado' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo verificar el inicio de sesión en ARBA' });
      throw new Error('No se pudo verificar el inicio de sesión en ARBA', { cause: error });
    }
  }

  private async irAGestionar(pagina: Page): Promise<void> {
    try {
      const urlGestionar = await pagina.getByRole('link', { name: 'Ingresá', exact: true }).getAttribute('href');

      if (!urlGestionar) {
        throw new Error('El botón Ingresá no tiene URL');
      }

      await pagina.goto(urlGestionar, { waitUntil: 'domcontentloaded', timeout: 60000 });

      this.logger.log({ url: urlGestionar, msg: 'Gestionar de ARBA abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Gestionar de ARBA' });
      throw new Error('No se pudo abrir Gestionar de ARBA', { cause: error });
    }
  }

  private async verificarCuitGestionar(pagina: Page, cuit: string): Promise<void> {
    try {
      const cuitMostrado = pagina
        .locator('address dl dt', { hasText: /^\s*CUIT\s*$/ })
        .locator('xpath=following-sibling::dd[1]//strong');

      await cuitMostrado.waitFor({ state: 'visible', timeout: 60000 });

      const cuitLogueado = (await cuitMostrado.innerText()).replace(/\D/g, '');

      if (cuitLogueado !== cuit.replace(/\D/g, '')) {
        throw new Error(`El CUIT logueado (${cuitLogueado}) no coincide con el CUIT esperado (${cuit})`);
      }

      this.logger.log({ cuit: cuitLogueado, msg: 'CUIT de Gestionar de ARBA verificado' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo verificar el CUIT en Gestionar de ARBA' });
      throw new Error('No se pudo verificar el CUIT en Gestionar de ARBA', { cause: error });
    }
  }

  private async abrirAccesosFrecuentes(pagina: Page): Promise<void> {
    try {
      const botonAccesosFrecuentes = pagina.getByRole('button', { name: /Mis accesos frecuentes/ });

      await botonAccesosFrecuentes.click({ timeout: 60000 });

      this.logger.log({ msg: 'Mis accesos frecuentes abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Mis accesos frecuentes' });
      throw new Error('No se pudo abrir Mis accesos frecuentes', { cause: error });
    }
  }

  private async irAPresentacionDeclaracionesJuradas(contexto: BrowserContext, pagina: Page): Promise<Page> {
    try {
      const accesoDeclaracionesJuradas = pagina
        .locator('li[data-nombre="Presentación de Declaraciones Juradas"]')
        .getByRole('link');

      const promesaPestaniaNueva = contexto.waitForEvent('page', { timeout: 60000 });

      await accesoDeclaracionesJuradas.click({ timeout: 60000 });

      const paginaDeclaracionesJuradas = await promesaPestaniaNueva;

      await paginaDeclaracionesJuradas.waitForLoadState('domcontentloaded', { timeout: 60000 });

      this.logger.log({ msg: 'Presentación de Declaraciones Juradas abierta' });

      return paginaDeclaracionesJuradas;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Presentación de Declaraciones Juradas' });
      throw new Error('No se pudo abrir Presentación de Declaraciones Juradas', { cause: error });
    }
  }

  private async abrirReimpresion(pagina: Page): Promise<void> {
    try {
      await pagina
        .locator('#navAplicaciones')
        .getByRole('link', { name: 'Reimpresión', exact: true })
        .click({ timeout: 60000 });

      this.logger.log({ msg: 'Menú Reimpresión abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir el menú Reimpresión' });
      throw new Error('No se pudo abrir el menú Reimpresión', { cause: error });
    }
  }

  private async irAConstanciaAnticipo(pagina: Page): Promise<void> {
    try {
      const href = await pagina
        .locator('#navAplicaciones')
        .getByRole('link', { name: 'Constancia anticipo', exact: true })
        .getAttribute('href', { timeout: 60000 });

      if (!href) {
        throw new Error('El link Constancia anticipo no tiene URL');
      }

      const urlConstanciaAnticipo = new URL(href, pagina.url()).toString();

      await pagina.goto(urlConstanciaAnticipo, { waitUntil: 'domcontentloaded', timeout: 60000 });

      this.logger.log({ url: urlConstanciaAnticipo, msg: 'Constancia anticipo abierta' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Constancia anticipo' });
      throw new Error('No se pudo abrir Constancia anticipo', { cause: error });
    }
  }

  private async abrirPestaniaPorCriteriosVarios(pagina: Page): Promise<void> {
    try {
      await pagina.getByRole('link', { name: 'Por criterios varios', exact: true }).click({ timeout: 60000 });

      this.logger.log({ msg: 'Pestaña Por criterios varios abierta' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir la pestaña Por criterios varios' });
      throw new Error('No se pudo abrir la pestaña Por criterios varios', { cause: error });
    }
  }

  private async seleccionarMesDesde(pagina: Page): Promise<void> {
    try {
      const mesAnterior = this.obtenerMesAnterior();

      await pagina.locator('#mesDesde').selectOption(mesAnterior, { timeout: 60000 });

      this.logger.log({ mes: mesAnterior, msg: 'Mes desde seleccionado' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo seleccionar el mes desde' });
      throw new Error('No se pudo seleccionar el mes desde', { cause: error });
    }
  }

  private async seleccionarMesHasta(pagina: Page): Promise<void> {
    try {
      const mesAnterior = this.obtenerMesAnterior();

      await pagina.locator('#mesHasta').selectOption(mesAnterior, { timeout: 60000 });

      this.logger.log({ mes: mesAnterior, msg: 'Mes hasta seleccionado' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo seleccionar el mes hasta' });
      throw new Error('No se pudo seleccionar el mes hasta', { cause: error });
    }
  }

  private async buscarDeclaracionesJuradas(pagina: Page): Promise<void> {
    try {
      await pagina.locator('#buscar').click({ timeout: 60000 });

      this.logger.log({ msg: 'Búsqueda de DDJJ enviada' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo buscar las DDJJ' });
      throw new Error('No se pudo buscar las DDJJ', { cause: error });
    }
  }

  private async existeDeclaracionJuradaMensual(pagina: Page): Promise<boolean> {
    const mesAnterior = this.obtenerMesAnterior();

    const encontrada = await this.obtenerFilaDeclaracionJuradaMensual(pagina)
      .waitFor({ state: 'visible', timeout: 60000 })
      .then(() => true)
      .catch(() => false);

    this.logger.log({ periodo: mesAnterior, encontrada, msg: 'Búsqueda de la DDJJ mensual del período' });

    return encontrada;
  }

  private async clickEditarDeclaracionJurada(pagina: Page): Promise<void> {
    try {
      await this.obtenerFilaDeclaracionJuradaMensual(pagina).locator('.iconoEditar').click({ timeout: 60000 });

      this.logger.log({ msg: 'Detalle de la DDJJ abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir el detalle de la DDJJ' });
      throw new Error('No se pudo abrir el detalle de la DDJJ', { cause: error });
    }
  }

  private async aceptarDialogo(pagina: Page): Promise<void> {
    try {
      await pagina
        .locator('.ui-dialog-buttonset')
        .getByRole('button', { name: 'Aceptar', exact: true })
        .click({ timeout: 60000 });

      this.logger.log({ msg: 'Diálogo aceptado' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo aceptar el diálogo' });
      throw new Error('No se pudo aceptar el diálogo', { cause: error });
    }
  }

  private async reimprimirConstancia(contexto: BrowserContext, pagina: Page): Promise<string> {
    try {
      const [respuestaPdf] = await Promise.all([
        contexto.waitForEvent('response', {
          predicate: (response) => (response.headers()['content-type'] ?? '').includes('application/pdf'),
          timeout: 60000,
        }),
        pagina.locator('#bconstancia').click({ timeout: 60000 }),
      ]);

      this.logger.log({ msg: 'Constancia generada' });

      return respuestaPdf.url();
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo reimprimir la constancia' });
      throw new Error('No se pudo reimprimir la constancia', { cause: error });
    }
  }

  private async descargarPdfConstancia(contexto: BrowserContext, urlPdf: string): Promise<string> {
    try {
      const respuestaPdf = await contexto.request.get(urlPdf, { timeout: 60000 });

      if (!respuestaPdf.ok()) {
        throw new Error(`No se pudo descargar el PDF de la constancia: ${respuestaPdf.status()}`);
      }

      const contenido = await respuestaPdf.body();
      const rutaPdf = join(await this.crearCarpetaTemporal(), 'acuse-de-recibo-arba.pdf');

      await writeFile(rutaPdf, contenido);

      for (const paginaAbierta of contexto.pages()) {
        if (paginaAbierta.url() === urlPdf) {
          await paginaAbierta.close();
        }
      }

      this.logger.log({ msg: 'PDF del acuse de recibo de ARBA descargado' });

      return rutaPdf;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo descargar el PDF del acuse de recibo de ARBA' });
      throw new Error('No se pudo descargar el PDF del acuse de recibo de ARBA', { cause: error });
    }
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'acuse-de-recibo-arba-'));
  }

  private obtenerFilaDeclaracionJuradaMensual(pagina: Page): Locator {
    const mesAnterior = this.obtenerMesAnterior();

    return pagina
      .locator('tbody tr')
      .filter({ has: pagina.locator('td:nth-child(3)', { hasText: /^\s*Mensual\s*$/ }) })
      .filter({ has: pagina.locator('td:nth-child(5)', { hasText: new RegExp(`^\\s*${mesAnterior}\\s*$`) }) })
      .first();
  }

  private obtenerMesAnterior(): string {
    const mesPasadoFecha = new Date();
    mesPasadoFecha.setDate(1);
    mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);

    return String(mesPasadoFecha.getMonth() + 1);
  }
}
