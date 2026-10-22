import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserContext, Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { formatearError } from '../../common/errores/formatear-error.js';

interface Presentacion {
  estado: number;
  cuitcuil: string;
  formulario: string;
  periodo: string;
  transaccion: number;
  fechaPresentacion: string;
}

@Injectable()
export class AcuseDeReciboArca {
  constructor(private readonly logger: Logger) {}

  async obtenerAcuseDeReciboArca(contexto: BrowserContext, pagina: Page): Promise<string> {
    this.logger.log({ msg: 'Obteniendo acuse de recibo' });

    let paginaDdjj: Page | undefined;

    try {
      paginaDdjj = await this.irAPaginaDdjjYPagos(contexto, pagina);

      const cuit = await this.obtenerCuitDelUsuario(pagina);

      const presentaciones = await this.obtenerPresentaciones(contexto, cuit);

      const periodo = this.obtenerPeriodoMesPasado();

      const presentacion = this.buscarPresentacionDelPeriodo(presentaciones, periodo);

      if (!presentacion) {
        return await this.guardarTxt(
          'acuse-de-recibo-no-tiene.txt',
          `El usuario no tiene acuse de recibo: no se encontró una presentación para el período ${periodo}`,
        );
      }

      const ruta = await this.descargarAcuseDeReciboArca(contexto, presentacion);

      this.logger.log({ periodo, msg: 'Acuse de recibo descargado' });

      return ruta;
    } catch (error) {
      this.logger.error({ err: error, msg: 'No se pudo obtener el acuse de recibo' });
      return await this.guardarTxt('acuse-de-recibo-error.txt', formatearError(error));
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

  private async obtenerPresentaciones(contexto: BrowserContext, cuit: string): Promise<Presentacion[]> {
    try {
      const orden = encodeURIComponent(JSON.stringify({ valor: 'FECHA_PRESENTACION', tipo: 'desc' }));

      const respuestaLista = await contexto.request.get(
        `https://seti.afip.gob.ar/setiweb/api/presentaciones/?usuario=TODOS&contribuyente=${cuit}&formulario=&mes=-&anio=-&orden=${orden}&pagina=1&totalPagina=20&cantTotal=0`,
      );

      if (!respuestaLista.ok()) {
        throw new Error(`No se pudo obtener la lista de presentaciones: ${respuestaLista.status()}`);
      }

      const { data } = await respuestaLista.json();

      const presentaciones: Presentacion[] = data?.resultados ?? [];

      this.logger.log({ cuit, cantidad: presentaciones.length, msg: 'Lista de presentaciones obtenida' });

      return presentaciones;
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'No se pudo obtener la lista de presentaciones' });
      throw new Error('No se pudo obtener la lista de presentaciones', { cause: error });
    }
  }

  private obtenerPeriodoMesPasado(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);

    const mesPasado = String(fecha.getMonth() + 1).padStart(2, '0');
    const anioPasado = fecha.getFullYear();

    const periodo = `${anioPasado}-${mesPasado}`;

    this.logger.log({ periodo, msg: 'Período a buscar' });

    return periodo;
  }

  private buscarPresentacionDelPeriodo(presentaciones: Presentacion[], periodo: string): Presentacion | null {
    return presentaciones.find((presentacion) => presentacion.periodo === periodo) ?? null;
  }

  private async descargarAcuseDeReciboArca(contexto: BrowserContext, presentacion: Presentacion): Promise<string> {
    try {
      const cabeceras = encodeURIComponent(JSON.stringify({ Accept: 'application/pdf' }));

      const respuestaTicket = await contexto.request.get(
        `https://seti.afip.gob.ar/setiweb/api/presentaciones/${presentacion.transaccion}/ticket?formato=PDF&responseType=arraybuffer&headers=${cabeceras}`,
      );

      if (!respuestaTicket.ok()) {
        throw new Error(`No se pudo descargar el acuse de recibo: ${respuestaTicket.status()}`);
      }

      const contenido = await respuestaTicket.body();
      const rutaPdf = join(await this.crearCarpetaTemporal(), 'acuse-de-recibo.pdf');

      await writeFile(rutaPdf, contenido);

      this.logger.log({ transaccion: presentacion.transaccion, periodo: presentacion.periodo, msg: 'Acuse de recibo descargado' });

      return rutaPdf;
    } catch (error) {
      this.logger.error({ err: error, transaccion: presentacion.transaccion, msg: 'No se pudo descargar el acuse de recibo' });
      throw new Error('No se pudo descargar el acuse de recibo', { cause: error });
    }
  }

  private async guardarTxt(nombreArchivo: string, contenido: string): Promise<string> {
    const ruta = join(await this.crearCarpetaTemporal(), nombreArchivo);

    await writeFile(ruta, contenido, 'utf-8');

    return ruta;
  }

  private async crearCarpetaTemporal(): Promise<string> {
    return mkdtemp(join(tmpdir(), 'acuse-de-recibo-'));
  }
}
