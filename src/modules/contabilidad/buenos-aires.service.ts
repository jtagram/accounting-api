import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { chromium, type Browser } from 'playwright';
import { iniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';
import { irAPaginaARCA } from './playwright/common/inicio-de-sesion/ir-a-pagina-arca.js';
import { irAPaginaMisServicios } from './playwright/common/mis-servicios/ir-a-pagina-mis-servicios.js';
import { obtenerOpcionesDeLanzamiento } from './playwright/common/navegador/obtener-opciones-de-lanzamiento.js';
import { guardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { prepararCarpetaDestino } from './playwright/common/guardar-pdf/preparar-carpeta-destino.js';
import { comprimirCarpeta } from './playwright/common/comprimir/comprimir-carpeta.js';
import { comprimirArchivosDeTexto } from './playwright/common/comprimir/comprimir-archivos-de-texto.js';
import { formatearError } from './playwright/common/errores/formatear-error.js';
import { construirErrorParaLog } from './playwright/common/errores/construir-error-para-log.js';
import { generarResumen, type ResultadoPdf } from './generar-resumen.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import { obtenerComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/obtener-comprobantes-emitidos.js';
import { obtenerComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/obtener-comprobantes-recibidos.js';
import { obtenerRetenciones } from './playwright/modules/retenciones/obtener-retenciones.js';
import { obtenerAcuseDeRecibo } from './playwright/modules/acuse-de-recibo/obtener-acuse-de-recibo.js';
import { obtenerPagoMonotributo } from './playwright/modules/pago-monotributo/obtener-pago-monotributo.js';
import { obtenerPagoCmSop } from './playwright/modules/pago-convenio-multilateral/obtener-pago-cm-sop.js';
import { obtenerDeclaracionJuradaArca } from './playwright/modules/declaracion-jurada-arca/obtener-declaracion-jurada-arca.js';

@Injectable()
export class BuenosAiresService {
  constructor(private readonly logger: Logger) {}

  // Clientes que trabajan solo en Buenos Aires: declaración jurada de ARCA.
  // Siempre devuelve un ZIP con una carpeta del cliente: con los PDFs y un resumen si todo
  // salió bien, o solo con error.txt (el stack trace) si algo falló.
  async ejecutarBuenosAires(usuario: string, clave: string): Promise<RespuestaEjecucion> {
    let navegador: Browser | undefined;
    // Hasta que el login devuelve el nombre del cliente, usamos el usuario (CUIT).
    let nombre = usuario;

    try {
      navegador = await chromium.launch(obtenerOpcionesDeLanzamiento());

      const contexto = await navegador.newContext();

      const pagina = await contexto.newPage();

      await irAPaginaARCA(this.logger, pagina);

      nombre = await iniciarSesionArca(this.logger, pagina, usuario, clave);

      await irAPaginaMisServicios(this.logger, pagina);

      const carpeta = await prepararCarpetaDestino(this.logger, nombre);

      const resultados: ResultadoPdf[] = [];

      const comprobantesEmitidos = await obtenerComprobantesEmitidos(this.logger, contexto, pagina);

      if (comprobantesEmitidos.descargado) {
        await guardarPdf(this.logger, comprobantesEmitidos.ruta, nombre, 'comprobantes-emitidos');
        resultados.push({ etiqueta: 'Comprobantes emitidos', nombreArchivo: 'comprobantes-emitidos.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Comprobantes emitidos', descargado: false, motivo: comprobantesEmitidos.motivo });
      }

      const comprobantesRecibidos = await obtenerComprobantesRecibidos(this.logger, contexto, pagina);

      if (comprobantesRecibidos.descargado) {
        await guardarPdf(this.logger, comprobantesRecibidos.ruta, nombre, 'comprobantes-recibidos');
        resultados.push({ etiqueta: 'Comprobantes recibidos', nombreArchivo: 'comprobantes-recibidos.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Comprobantes recibidos', descargado: false, motivo: comprobantesRecibidos.motivo });
      }

      const retenciones = await obtenerRetenciones(this.logger, contexto, pagina);

      if (retenciones.descargado) {
        await guardarPdf(this.logger, retenciones.ruta, nombre, 'retenciones');
        resultados.push({ etiqueta: 'Retenciones', nombreArchivo: 'retenciones.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Retenciones', descargado: false, motivo: retenciones.motivo });
      }

      const acuseDeRecibo = await obtenerAcuseDeRecibo(this.logger, contexto, pagina);

      if (acuseDeRecibo.descargado) {
        await guardarPdf(this.logger, acuseDeRecibo.ruta, nombre, 'acuse-de-recibo');
        resultados.push({ etiqueta: 'Acuse de recibo', nombreArchivo: 'acuse-de-recibo.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Acuse de recibo', descargado: false, motivo: acuseDeRecibo.motivo });
      }

      const pagoMonotributo = await obtenerPagoMonotributo(this.logger, contexto, pagina);

      if (pagoMonotributo.descargado) {
        await guardarPdf(this.logger, pagoMonotributo.ruta, nombre, 'monotributo');
        resultados.push({ etiqueta: 'Pago de monotributo', nombreArchivo: 'monotributo.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Pago de monotributo', descargado: false, motivo: pagoMonotributo.motivo });
      }

      const pagoConvenioMultilateral = await obtenerPagoCmSop(this.logger, contexto, pagina);

      if (pagoConvenioMultilateral.descargado) {
        await guardarPdf(this.logger, pagoConvenioMultilateral.ruta, nombre, 'convenio-multilateral');
        resultados.push({ etiqueta: 'Pago de convenio multilateral', nombreArchivo: 'convenio-multilateral.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Pago de convenio multilateral', descargado: false, motivo: pagoConvenioMultilateral.motivo });
      }

      const declaracionJurada = await obtenerDeclaracionJuradaArca(this.logger, contexto, pagina);

      if (declaracionJurada.descargado) {
        await guardarPdf(this.logger, declaracionJurada.ruta, nombre, 'declaracion-jurada');
        resultados.push({ etiqueta: 'Declaración jurada de ARCA', nombreArchivo: 'declaracion-jurada.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Declaración jurada de ARCA', descargado: false, motivo: declaracionJurada.motivo });
      }

      await pagina.waitForTimeout(1000);

      this.logger.log({
        nombre,
        descargados: resultados.filter((resultado) => resultado.descargado).length,
        noDisponibles: resultados.filter((resultado) => !resultado.descargado).length,
        msg: 'Ejecución completada',
      });

      const resumen = { nombre: 'resumen.txt', contenido: generarResumen(nombre, resultados) };

      return { nombre, exito: true, zip: comprimirCarpeta(carpeta, sanitizarNombre(nombre), [resumen]) };
    } catch (error) {
      this.logger.error({
        err: construirErrorParaLog(error),
        nombre,
        msg: 'La ejecución falló',
      });

      const archivoError = { nombre: 'error.txt', contenido: formatearError(error) };

      return { nombre, exito: false, zip: comprimirArchivosDeTexto(sanitizarNombre(nombre), [archivoError]) };
    } finally {
      // Si el cierre fallara, no debe pisar la respuesta que ya se armó.
      await navegador?.close().catch(() => undefined);
    }
  }
}
