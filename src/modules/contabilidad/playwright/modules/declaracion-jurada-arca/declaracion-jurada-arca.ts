import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Download, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

interface CriterioDeBusqueda {
  anticipoBuscado: string;
  mesActual: number;
  anioActual: number;
}

@Injectable()
export class DeclaracionJuradaArca {
  constructor(private readonly logger: Logger) {}

  async obtenerDeclaracionJuradaArca(contexto: BrowserContext, pagina: Page): Promise<string> {
    this.logger.log({ msg: 'Obteniendo declaración jurada de ARCA' });

    let paginaDdjj: Page | undefined;

    try {
      const cuit = await this.obtenerCuitDelUsuario(pagina);

      paginaDdjj = await this.irAPaginaSifereDdjj(contexto, pagina, cuit);

      const criterio = this.obtenerCriterioDeBusqueda();

      const indiceFila = await this.buscarFilaDeLaDdjj(paginaDdjj, criterio);

      if (indiceFila === null) {
        return await this.guardarTxt(
          'declaracion-jurada-arca-no-tiene.txt',
          'El usuario no tiene declaración jurada de ARCA: no se encontró una DDJJ mensual para el período buscado',
        );
      }

      const promesaDescarga = paginaDdjj.waitForEvent('download');

      await this.presionarReporteDeDj(paginaDdjj, indiceFila);

      const descarga = await promesaDescarga;

      const ruta = await this.guardarPdf(descarga);

      this.logger.log({ cuit, msg: 'Declaración jurada de ARCA descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo obtener la declaración jurada de ARCA' });
      return await this.guardarTxt('declaracion-jurada-arca-error.txt', formatearError(error));
    } finally {
      await paginaDdjj?.close().catch(() => undefined);
    }
  }

  private async obtenerCuitDelUsuario(pagina: Page): Promise<string> {
    try {
      const cuit = (await pagina.locator('#usernav .numeroCuit').innerText())
        .trim()
        .replace(/-/g, '')
        .replace(/[[\]]/g, '');

      this.logger.log({ cuit, msg: 'CUIT del usuario obtenido' });

      return cuit;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo obtener el CUIT del usuario' });
      throw new Error('No se pudo obtener el CUIT del usuario', { cause: error });
    }
  }

  private async irAPaginaSifereDdjj(contexto: BrowserContext, pagina: Page, cuit: string): Promise<Page> {
    const paginaDdjj = await this.irAPaginaServicioComarb(contexto, pagina, 'comarb_sifereweb_ddjj');

    try {
      const selectorCuit = paginaDdjj.locator('select#cuit');
      const cuitSeleccionado = await selectorCuit.inputValue();

      if (cuitSeleccionado !== cuit) {
        throw new Error(`El CUIT seleccionado (${cuitSeleccionado}) no coincide con el esperado (${cuit})`);
      }

      await paginaDdjj.locator('input[value="Seleccionar"]').click();
      await paginaDdjj.waitForLoadState('networkidle');

      const botonConfirmar = paginaDdjj.locator('input[value="Si. Confirmar Ingreso al Sistema"]');
      const enlaceListado = paginaDdjj.locator('#INICIO_listado_ddjj_mensuales');

      await botonConfirmar.or(enlaceListado).waitFor({ state: 'visible', timeout: 60000 });

      if (await botonConfirmar.isVisible()) {
        const cuitConfirmado = await paginaDdjj.locator('input[name="cuit"][readonly]').inputValue();

        if (cuitConfirmado !== cuit) {
          throw new Error(`El CUIT a confirmar (${cuitConfirmado}) no coincide con el esperado (${cuit})`);
        }

        await botonConfirmar.click();
        await paginaDdjj.waitForLoadState('networkidle');
      }

      await enlaceListado.click();
      await paginaDdjj.waitForLoadState('networkidle');

      await paginaDdjj.locator('#tableMensualDj tbody tr').first().waitFor({ state: 'visible' });

      this.logger.log({ cuit, msg: 'Listado de DDJJ mensuales abierto' });

      return paginaDdjj;
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo abrir el listado de DDJJ mensuales' });
      await paginaDdjj.close();
      throw new Error('No se pudo abrir el listado de DDJJ mensuales', { cause: error });
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

  private obtenerCriterioDeBusqueda(): CriterioDeBusqueda {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const mesPasadoFecha = new Date(hoy);
    mesPasadoFecha.setMonth(mesPasadoFecha.getMonth() - 1);
    const anticipoBuscado = `${mesPasadoFecha.getFullYear()}${String(mesPasadoFecha.getMonth() + 1).padStart(2, '0')}`;

    this.logger.log({ anticipoBuscado, mesActual, anioActual, msg: 'Criterio de búsqueda de la DDJJ' });

    return { anticipoBuscado, mesActual, anioActual };
  }

  private async buscarFilaDeLaDdjj(pagina: Page, criterio: CriterioDeBusqueda): Promise<number | null> {
    try {
      const filas = pagina.locator('#tableMensualDj tbody tr');
      const cantidad = await filas.count();

      for (let i = 0; i < cantidad; i++) {
        const fila = filas.nth(i);

        const anticipoTexto = (await fila.locator('td').nth(1).innerText()).trim();
        const fechaCreacionTexto = (await fila.locator('td').nth(3).innerText()).trim();

        const anticipoYYYYMM = (anticipoTexto.split(' - ')[0] ?? '').trim();
        const [, mesTexto, anioTexto] = fechaCreacionTexto.split('/');

        const esMesActual = Number(mesTexto) === criterio.mesActual && Number(anioTexto) === criterio.anioActual;
        const esAnticipoMesPasado = anticipoYYYYMM === criterio.anticipoBuscado;

        if (esMesActual && esAnticipoMesPasado) {
          this.logger.log({ indiceFila: i, anticipoBuscado: criterio.anticipoBuscado, msg: 'Fila de la DDJJ mensual encontrada' });

          return i;
        }
      }

      this.logger.log({ anticipoBuscado: criterio.anticipoBuscado, filasRevisadas: cantidad, msg: 'Fila de la DDJJ mensual no encontrada' });

      return null;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo buscar la fila de la DDJJ mensual' });
      throw new Error('No se pudo buscar la fila de la DDJJ mensual', { cause: error });
    }
  }

  private async presionarReporteDeDj(pagina: Page, indiceFila: number): Promise<void> {
    try {
      await pagina.locator('#tableMensualDj tbody tr').nth(indiceFila).locator('a[title="Reporte de DJ"]').click();

      this.logger.log({ indiceFila, msg: 'Reporte de DJ presionado' });
    } catch (error) {
      this.logger.error({ err: error, indiceFila, msg: 'No se pudo presionar el Reporte de DJ' });
      throw new Error('No se pudo presionar el Reporte de DJ', { cause: error });
    }
  }

  private async guardarPdf(descarga: Download): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), 'declaracion-jurada-arca.pdf');

    await descarga.saveAs(ruta);

    return ruta;
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'declaracion-jurada-arca-'));
  }
}
