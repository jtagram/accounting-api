import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

interface Vep {
  estado: number;
  nroVep: number;
  cuit: string;
  importe: number;
  descripcion: string;
  fechaDePago: string;
}

@Injectable()
export class PagoMonotributo {
  constructor(private readonly logger: Logger) {}

  async obtenerPagoMonotributo(contexto: BrowserContext, pagina: Page): Promise<string> {
    this.logger.log({ msg: 'Obteniendo pago de monotributo' });

    let paginaDdjj: Page | undefined;

    try {
      paginaDdjj = await this.irAPaginaDdjjYPagos(contexto, pagina);

      const cuit = await this.obtenerCuitDelUsuario(pagina);

      const veps = await this.obtenerVeps(contexto, cuit);

      const descripcion = this.obtenerDescripcionDelMesActual();

      const vep = this.buscarVepPorDescripcion(veps, descripcion);

      if (!vep) {
        return await this.guardarTxt(
          'pago-monotributo-no-tiene.txt',
          `El usuario no tiene pago de monotributo: no se encontró un pago de monotributo para ${descripcion}`,
        );
      }

      const ruta = await this.descargarComprobanteDePago(contexto, vep);

      this.logger.log({ descripcion, msg: 'Pago de monotributo descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo obtener el pago de monotributo' });
      return await this.guardarTxt('pago-monotributo-error.txt', formatearError(error));
    } finally {
      await paginaDdjj?.close().catch(() => undefined);
    }
  }

  private async irAPaginaDdjjYPagos(contexto: BrowserContext, pagina: Page): Promise<Page> {
    try {
      const [paginaDdjj] = await Promise.all([
        contexto.waitForEvent('page'),
        pagina.locator('a[title="setidj"]').click(),
      ]);

      await paginaDdjj.bringToFront();

      await paginaDdjj.waitForLoadState('domcontentloaded');

      const botonEntendido = paginaDdjj.getByRole('button', { name: 'Entendido' });

      if (await botonEntendido.isVisible({ timeout: 5000 }).catch(() => false)) {
        await botonEntendido.click();
      }

      this.logger.log({ msg: 'Presentación de DDJJ y Pagos abierto' });

      return paginaDdjj;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo abrir Presentación de DDJJ y Pagos' });
      throw new Error('No se pudo abrir Presentación de DDJJ y Pagos', { cause: error });
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

  private async obtenerVeps(contexto: BrowserContext, cuit: string): Promise<Vep[]> {
    try {
      const orden = encodeURIComponent(JSON.stringify({ valor: 'vepId', tipo: 'desc' }));

      const respuestaLista = await contexto.request.get(
        `https://seti.afip.gob.ar/setiweb/api/pagos?usuario=TODOS&contribuyente=${cuit}&estado=seticommon.todos.rotulo&tipoDePago=TODOS&mes=-&anio=-&ultimosMeses=12&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
      );

      if (!respuestaLista.ok()) {
        throw new Error(`No se pudo obtener la lista de pagos: ${respuestaLista.status()}`);
      }

      const { data } = await respuestaLista.json();

      const veps: Vep[] = data?.vepsConsultados ?? [];

      this.logger.log({ cuit, cantidad: veps.length, msg: 'Lista de pagos obtenida' });

      return veps;
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo obtener la lista de pagos' });
      throw new Error('No se pudo obtener la lista de pagos', { cause: error });
    }
  }

  private obtenerDescripcionDelMesActual(): string {
    const hoy = new Date();
    const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
    const anioActual = String(hoy.getFullYear()).slice(-2);

    const descripcion = `MONOTR${mesActual}/${anioActual}`;

    this.logger.log({ descripcion, msg: 'Descripción a buscar' });

    return descripcion;
  }

  private buscarVepPorDescripcion(veps: Vep[], descripcion: string): Vep | null {
    return veps.find((vep) => vep.descripcion === descripcion) ?? null;
  }

  private async descargarComprobanteDePago(contexto: BrowserContext, vep: Vep): Promise<string> {
    try {
      const respuestaTicket = await contexto.request.get(
        `https://seti.afip.gob.ar/setiweb/api/pagos/${vep.nroVep}/ticket?formato=PDF`,
      );

      if (!respuestaTicket.ok()) {
        throw new Error(`No se pudo descargar el comprobante de pago: ${respuestaTicket.status()}`);
      }

      const contenido = await respuestaTicket.body();
      const rutaPdf = join(await this.crearCarpetaTemporal(), 'pago-monotributo.pdf');

      await writeFile(rutaPdf, contenido);

      this.logger.log({ nroVep: vep.nroVep, descripcion: vep.descripcion, msg: 'Comprobante de pago descargado' });

      return rutaPdf;
    } catch (error) {
      this.logger.error({ err: error, nroVep: vep.nroVep, msg: 'No se pudo descargar el comprobante de pago' });
      throw new Error('No se pudo descargar el comprobante de pago', { cause: error });
    }
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'pago-monotributo-'));
  }
}
