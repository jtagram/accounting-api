import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

@Injectable()
export class DeclaracionJuradaAgip {
  constructor(private readonly logger: Logger) {}

  async obtenerDeclaracionJuradaAGIP(contexto: BrowserContext, cuit: string, clave: string): Promise<string> {
    this.logger.log({ cuit, msg: 'Obteniendo declaración jurada de AGIP' });

    let paginaAgip: Page | undefined;
    let paginaESicol: Page | undefined;

    try {
      paginaAgip = await this.irAPaginaAGIP(contexto);

      await this.iniciarSesion(paginaAgip, cuit, clave);

      paginaESicol = await this.irAPaginaESicol(contexto, paginaAgip);

      await this.abrirDeclaracionesJuradasPresentadas(paginaESicol);

      const encontrada = await this.seleccionarMesAnteriorDeclaracionJurada(paginaESicol);

      if (!encontrada) {
        return await this.guardarTxt(
          'declaracion-jurada-agip-no-tiene.txt',
          'El usuario no tiene declaración jurada de AGIP: no se encontró una DDJJ presentada para el período buscado en AGIP',
        );
      }

      const urlPdf = await this.imprimirDeclaracionJurada(contexto, paginaESicol);

      const ruta = await this.descargarPdfDeclaracionJurada(contexto, urlPdf);

      this.logger.log({ cuit, msg: 'Declaración jurada de AGIP descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo obtener la declaración jurada de AGIP' });
      return await this.guardarTxt('declaracion-jurada-agip-error.txt', formatearError(error));
    } finally {
      await paginaESicol?.close().catch(() => undefined);
      await paginaAgip?.close().catch(() => undefined);
    }
  }

  private async irAPaginaAGIP(contexto: BrowserContext): Promise<Page> {
    try {
      const paginaAgip = await contexto.newPage();

      await paginaAgip.goto('https://claveciudad.agip.gob.ar/#', { waitUntil: 'domcontentloaded', timeout: 60000 });

      this.logger.log({ msg: 'Página de AGIP abierta' });

      return paginaAgip;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir AGIP' });
      throw new Error('No se pudo abrir AGIP', { cause: error });
    }
  }

  private async iniciarSesion(pagina: Page, cuit: string, clave: string): Promise<void> {
    try {
      await pagina.locator('.clave-ciudad-info').getByRole('link', { name: 'Clave Ciudad' }).click();

      await pagina.locator('#cuit').fill(cuit.replace(/\D/g, ''));

      await pagina.locator('#clave').fill(clave);

      await pagina.locator('.form-Login').getByRole('button', { name: 'Ingresar' }).click();

      await this.verificarInicioSesion(pagina, cuit);

      this.logger.log({ cuit, msg: 'Sesión iniciada en AGIP (Clave Ciudad)' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo iniciar sesión en AGIP' });
      throw new Error('No se pudo iniciar sesión en AGIP', { cause: error });
    }
  }

  private async verificarInicioSesion(pagina: Page, cuit: string): Promise<void> {
    try {
      await pagina
        .locator('.navbar-header')
        .getByRole('link', { name: 'Portal del Contribuyente' })
        .waitFor({ state: 'visible', timeout: 60000 });

      const cuitYRazon = (await pagina.locator('.cuityrazon span').innerText()).trim();

      const cuitLogueado = (cuitYRazon.match(/\(([\d-]+)\)\s*$/)?.[1] ?? '').replace(/-/g, '');

      if (cuitLogueado !== cuit.replace(/\D/g, '')) {
        throw new Error(`El CUIT logueado (${cuitYRazon}) no coincide con el CUIT esperado (${cuit})`);
      }

      this.logger.log({ cuit: cuitLogueado, msg: 'Inicio de sesión en AGIP verificado' });
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo verificar el inicio de sesión en AGIP' });
      throw error;
    }
  }

  private async irAPaginaESicol(contexto: BrowserContext, pagina: Page): Promise<Page> {
    try {
      const servicioESicol = pagina
        .locator('#aplicaciones .contiene_servicio')
        .filter({ has: pagina.locator('.titulo_servicio', { hasText: /^\s*e-Sicol\s*$/ }) })
        .locator('a.learn-more');

      const promesaVentanaEmergente = contexto.waitForEvent('page', { timeout: 15000 }).catch(() => null);

      await servicioESicol.click();

      const paginaESicol = (await promesaVentanaEmergente) ?? pagina;

      await paginaESicol.waitForLoadState('domcontentloaded', { timeout: 60000 });

      this.logger.log({ msg: 'e-Sicol abierto' });

      return paginaESicol;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir e-Sicol' });
      throw new Error('No se pudo abrir e-Sicol', { cause: error });
    }
  }

  private async abrirDeclaracionesJuradasPresentadas(pagina: Page): Promise<void> {
    try {
      const grupoPresentadas = pagina
        .locator('tr.x-grid-group-hd')
        .filter({ hasText: /Declaraciones Juradas Presentadas:\s*\d+/ });

      await grupoPresentadas.waitFor({ state: 'visible', timeout: 60000 });

      const estaColapsado = await grupoPresentadas.evaluate((tr) => tr.classList.contains('x-grid-group-hd-collapsed'));

      if (estaColapsado) {
        await grupoPresentadas.locator('.x-grid-group-title').click();

        await pagina
          .locator('tr.x-grid-group-hd:not(.x-grid-group-hd-collapsed)')
          .filter({ hasText: /Declaraciones Juradas Presentadas:\s*\d+/ })
          .waitFor({ state: 'visible' });
      }

      const titulo = (await grupoPresentadas.innerText()).trim();

      this.logger.log({ titulo, msg: `${titulo} (grupo expandido)` });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Declaraciones Juradas Presentadas' });
      throw new Error('No se pudo abrir Declaraciones Juradas Presentadas', { cause: error });
    }
  }

  private async seleccionarMesAnteriorDeclaracionJurada(pagina: Page): Promise<boolean> {
    try {
      const mesPasadoFecha = new Date();
      mesPasadoFecha.setDate(1);
      mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
      const periodoBuscado = `${mesPasadoFecha.getFullYear()}-${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

      this.logger.log({ periodo: periodoBuscado, msg: 'Período de DDJJ a buscar en e-Sicol' });

      const filaMesPasado = pagina
        .locator('tr.x-grid-row')
        .filter({ has: pagina.locator('td:nth-child(2)', { hasText: /^\s*Presentada\s*$/ }) })
        .filter({ has: pagina.locator('td:nth-child(3)', { hasText: new RegExp(`^\\s*${periodoBuscado}\\s*$`) }) })
        .first();

      if ((await filaMesPasado.count()) === 0) {
        this.logger.log({ periodo: periodoBuscado, msg: 'No se encontró una DDJJ presentada para el período' });
        return false;
      }

      await filaMesPasado.click();

      this.logger.log({ periodo: periodoBuscado, msg: 'DDJJ del período seleccionada' });

      return true;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo seleccionar la DDJJ del mes pasado' });
      throw new Error('No se pudo seleccionar la DDJJ del mes pasado', { cause: error });
    }
  }

  private async imprimirDeclaracionJurada(contexto: BrowserContext, pagina: Page): Promise<string> {
    try {
      const [respuestaPdf] = await Promise.all([
        contexto.waitForEvent('response', {
          predicate: (response) => response.url().includes('/eSicol/cc/reporte/ddjjpresentacion.pdf'),
          timeout: 60000,
        }),
        pagina.locator('.imprimir-ddjj').click(),
      ]);

      this.logger.log({ msg: 'Reporte de DDJJ generado' });

      return respuestaPdf.url();
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo imprimir la DDJJ' });
      throw new Error('No se pudo imprimir la DDJJ', { cause: error });
    }
  }

  private async descargarPdfDeclaracionJurada(contexto: BrowserContext, urlPdf: string): Promise<string> {
    try {
      const respuestaPdf = await contexto.request.get(urlPdf, { timeout: 60000 });

      if (!respuestaPdf.ok()) {
        throw new Error(`No se pudo descargar el PDF de la DDJJ: ${respuestaPdf.status()}`);
      }

      const ddjjId = new URL(urlPdf).searchParams.get('ddjjId') ?? String(Date.now());

      const contenido = await respuestaPdf.body();
      const rutaPdf = join(await this.crearCarpetaTemporal(), 'declaracion-jurada-agip.pdf');

      await writeFile(rutaPdf, contenido);

      for (const paginaAbierta of contexto.pages()) {
        if (paginaAbierta.url().includes('/eSicol/cc/reporte/ddjjpresentacion.pdf')) {
          await paginaAbierta.close();
        }
      }

      this.logger.log({ ddjjId, msg: 'PDF de la DDJJ de AGIP descargado' });

      return rutaPdf;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo descargar el PDF de la DDJJ de AGIP' });
      throw new Error('No se pudo descargar el PDF de la DDJJ de AGIP', { cause: error });
    }
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'declaracion-jurada-agip-'));
  }
}
