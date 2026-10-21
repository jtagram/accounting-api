import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Download, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

@Injectable()
export class ComprobantesEmitidos {
  constructor(private readonly logger: Logger) {}

  async obtenerComprobantesEmitidos(contexto: BrowserContext, pagina: Page): Promise<string> {
    this.logger.log({ msg: 'Obteniendo comprobantes emitidos' });

    let paginaMisComprobantes: Page | undefined;

    try {
      paginaMisComprobantes = await this.irAPaginaMisComprobantes(contexto, pagina);

      await this.irAPaginaComprobantesEmitidos(paginaMisComprobantes);

      await this.seleccionarMesAnterior(paginaMisComprobantes);

      await this.buscarComprobantes(paginaMisComprobantes);

      await this.esperarResultadosDeBusqueda(paginaMisComprobantes);

      if (await this.noHayComprobantesEmitidos(paginaMisComprobantes)) {

        return await this.guardarTxt('comprobantes-emitidos-no-tiene.txt', 'El usuario no tiene comprobantes emitidos');
      }

      await this.esperarAlMenosUnComprobante(paginaMisComprobantes);

      const promesaDescarga = paginaMisComprobantes.waitForEvent('download');

      await this.presionarBotonPdf(paginaMisComprobantes);

      const descarga = await promesaDescarga;

      const ruta = await this.guardarPdf(descarga);

      this.logger.log({ msg: 'Comprobantes emitidos descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudieron obtener los comprobantes emitidos' });
      return await this.guardarTxt('comprobantes-emitidos-error.txt', formatearError(error));
    } finally {
      await paginaMisComprobantes?.close().catch(() => undefined);
    }
  }

  private async irAPaginaMisComprobantes(contexto: BrowserContext, pagina: Page): Promise<Page> {
    try {
      const [paginaMisComprobantes] = await Promise.all([
        contexto.waitForEvent('page'),
        pagina.getByRole('heading', { name: 'MIS COMPROBANTES' }).click(),
      ]);

      await paginaMisComprobantes.bringToFront();

      await paginaMisComprobantes.waitForLoadState('domcontentloaded');

      await paginaMisComprobantes.locator('#titulo', { hasText: 'Mis Comprobantes' }).waitFor({
        state: 'visible',
      });

      this.logger.log({ msg: 'Mis Comprobantes abierto' });

      return paginaMisComprobantes;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Mis Comprobantes' });
      throw new Error('No se pudo abrir Mis Comprobantes', { cause: error });
    }
  }

  private async irAPaginaComprobantesEmitidos(pagina: Page): Promise<void> {
    try {
      await pagina.locator('#btnEmitidos').click();

      await pagina.locator('#titulo', { hasText: 'Comprobantes Emitidos' }).waitFor({
        state: 'visible',
      });

      this.logger.log({ msg: 'Comprobantes Emitidos abierto' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Comprobantes Emitidos' });
      throw new Error('No se pudo abrir Comprobantes Emitidos', { cause: error });
    }
  }

  private async seleccionarMesAnterior(pagina: Page): Promise<void> {
    try {
      await pagina.locator('#fechaEmision').click();

      await pagina.locator('li[data-range-key="Mes Pasado"]').click();

      const rangoFechas = await pagina.locator('#fechaEmision').inputValue();

      this.verificarMesAnterior(rangoFechas);

      this.logger.log({ rangoFechas, msg: 'Rango de fechas seleccionado' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo seleccionar el mes pasado' });
      throw new Error('No se pudo seleccionar el mes pasado', { cause: error });
    }
  }

  private verificarMesAnterior(rangoFechas: string): void {
    const hoy = new Date();
    const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const formatearFecha = (fecha: Date) =>
      `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

    const rangoEsperado = `${formatearFecha(primerDiaMesPasado)} - ${formatearFecha(ultimoDiaMesPasado)}`;

    if (rangoFechas !== rangoEsperado) {
      this.logger.error({ rangoFechas, rangoEsperado, msg: 'El rango de fechas no corresponde al mes pasado' });
      throw new Error(`El rango de fechas (${rangoFechas}) no corresponde al mes pasado (${rangoEsperado})`);
    }
  }

  private async buscarComprobantes(pagina: Page): Promise<void> {
    try {
      await pagina.locator('#buscarComprobantes').click();

      this.logger.log({ msg: 'Búsqueda de comprobantes ejecutada' });
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo buscar los comprobantes' });
      throw new Error('No se pudo buscar los comprobantes', { cause: error });
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

  private async noHayComprobantesEmitidos(pagina: Page): Promise<boolean> {
    try {
      const noExisteInformacion = pagina.locator('td.dataTables_empty', {
        hasText: 'No existe información para los filtros ingresados',
      });

      const infoSinRegistros = pagina.locator('#tablaDataTables_info', {
        hasText: 'Mostrando 0 registros de un total de 0',
      });

      const alMenosUnComprobante = pagina.locator('#tablaDataTables tbody tr[role="row"]').first();

      const sinComprobantes = Promise.all([
        noExisteInformacion.waitFor({ state: 'visible' }),
        infoSinRegistros.waitFor({ state: 'visible' }),
      ]).then(() => true as const);

      const conComprobantes = alMenosUnComprobante.waitFor({ state: 'visible' }).then(() => false as const);

      sinComprobantes.catch(() => {});
      conComprobantes.catch(() => {});

      const noHayComprobantes = await Promise.race([sinComprobantes, conComprobantes]);

      if (noHayComprobantes) {
        this.logger.log({
          informacion: await noExisteInformacion.innerText(),
          registros: await infoSinRegistros.innerText(),
          msg: 'No hay comprobantes para los filtros ingresados',
        });
      } else {
        this.logger.log('Hay comprobantes para los filtros ingresados');
      }

      return noHayComprobantes;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo verificar si hay comprobantes' });
      throw new Error('No se pudo verificar si hay comprobantes', { cause: error });
    }
  }

  private async esperarAlMenosUnComprobante(pagina: Page): Promise<void> {
    try {
      await pagina.locator('#tablaDataTables tbody tr[role="row"]').first().waitFor({
        state: 'visible',
      });

      this.logger.log('Al menos un comprobante visible');
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo esperar al menos un comprobante' });
      throw new Error('No se pudo esperar al menos un comprobante', { cause: error });
    }
  }

  private async presionarBotonPdf(pagina: Page): Promise<void> {
    try {
      await pagina.getByRole('button', { name: 'PDF' }).click();

      this.logger.log('Botón PDF presionado');
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo presionar el botón PDF' });
      throw new Error('No se pudo presionar el botón PDF', { cause: error });
    }
  }

  private async guardarPdf(descarga: Download): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), 'comprobantes-emitidos.pdf');

    await descarga.saveAs(ruta);

    return ruta;
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'comprobantes-emitidos-'));
  }
}
