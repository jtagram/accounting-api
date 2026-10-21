import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { chromium, type Browser } from 'playwright';
import { iniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';
import { irAPaginaARCA } from './playwright/common/inicio-de-sesion/ir-a-pagina-arca.js';
import { irAPaginaMisServicios } from './playwright/common/mis-servicios/ir-a-pagina-mis-servicios.js';
import { guardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { prepararCarpetaDestino } from './playwright/common/guardar-pdf/preparar-carpeta-destino.js';
import { comprimirCarpeta } from './playwright/common/comprimir/comprimir-carpeta.js';
import { comprimirArchivosDeTexto } from './playwright/common/comprimir/comprimir-archivos-de-texto.js';
import { formatearError } from './playwright/common/errores/formatear-error.js';
import { generarResumen, type ResultadoPdf } from './generar-resumen.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import { obtenerComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/obtener-comprobantes-emitidos.js';
import { obtenerComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/obtener-comprobantes-recibidos.js';
import { obtenerRetenciones } from './playwright/modules/retenciones/obtener-retenciones.js';
import { obtenerAcuseDeRecibo } from './playwright/modules/acuse-de-recibo/obtener-acuse-de-recibo.js';
import { obtenerPagoMonotributo } from './playwright/modules/pago-monotributo/obtener-pago-monotributo.js';
import { obtenerPagoCmSop } from './playwright/modules/pago-convenio-multilateral/obtener-pago-cm-sop.js';
import { obtenerDeclaracionJuradaAGIP } from './playwright/modules/declaracion-jurada-agip/obtener-declaracion-jurada-agip.js';

@Injectable()
export class BuenosAiresCabaService {
  constructor(private readonly logger: Logger) {}

  // Clientes que trabajan en Buenos Aires y CABA: declaración jurada de AGIP.
  // Siempre devuelve un ZIP con una carpeta del cliente: con los PDFs y un resumen si todo
  // salió bien, o solo con error.txt (el stack trace) si algo falló.
  async ejecutarBuenosAiresCaba(usuario: string, clave: string, claveAgip: string): Promise<RespuestaEjecucion> {
    let navegador: Browser | undefined;
    // Hasta que el login devuelve el nombre del cliente, usamos el usuario (CUIT).
    let nombre = usuario;

    try {
      navegador = await chromium.launch({
        headless: false,
        slowMo: 100,
      });

      const contexto = await navegador.newContext();

      const pagina = await contexto.newPage();

      await irAPaginaARCA(pagina);

      nombre = await iniciarSesionArca(pagina, usuario, clave);

      await irAPaginaMisServicios(pagina);

      const carpeta = await prepararCarpetaDestino(nombre);

      const resultados: ResultadoPdf[] = [];

      const comprobantesEmitidos = await obtenerComprobantesEmitidos(contexto, pagina);

      if (comprobantesEmitidos.descargado) {
        await guardarPdf(comprobantesEmitidos.ruta, nombre, 'comprobantes-emitidos');
        resultados.push({ etiqueta: 'Comprobantes emitidos', nombreArchivo: 'comprobantes-emitidos.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Comprobantes emitidos', descargado: false, motivo: comprobantesEmitidos.motivo });
      }

      const comprobantesRecibidos = await obtenerComprobantesRecibidos(contexto, pagina);

      if (comprobantesRecibidos.descargado) {
        await guardarPdf(comprobantesRecibidos.ruta, nombre, 'comprobantes-recibidos');
        resultados.push({ etiqueta: 'Comprobantes recibidos', nombreArchivo: 'comprobantes-recibidos.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Comprobantes recibidos', descargado: false, motivo: comprobantesRecibidos.motivo });
      }

      const retenciones = await obtenerRetenciones(contexto, pagina);

      if (retenciones.descargado) {
        await guardarPdf(retenciones.ruta, nombre, 'retenciones');
        resultados.push({ etiqueta: 'Retenciones', nombreArchivo: 'retenciones.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Retenciones', descargado: false, motivo: retenciones.motivo });
      }

      const acuseDeRecibo = await obtenerAcuseDeRecibo(contexto, pagina);

      if (acuseDeRecibo.descargado) {
        await guardarPdf(acuseDeRecibo.ruta, nombre, 'acuse-de-recibo');
        resultados.push({ etiqueta: 'Acuse de recibo', nombreArchivo: 'acuse-de-recibo.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Acuse de recibo', descargado: false, motivo: acuseDeRecibo.motivo });
      }

      const pagoMonotributo = await obtenerPagoMonotributo(contexto, pagina);

      if (pagoMonotributo.descargado) {
        await guardarPdf(pagoMonotributo.ruta, nombre, 'monotributo');
        resultados.push({ etiqueta: 'Pago de monotributo', nombreArchivo: 'monotributo.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Pago de monotributo', descargado: false, motivo: pagoMonotributo.motivo });
      }

      const pagoConvenioMultilateral = await obtenerPagoCmSop(contexto, pagina);

      if (pagoConvenioMultilateral.descargado) {
        await guardarPdf(pagoConvenioMultilateral.ruta, nombre, 'convenio-multilateral');
        resultados.push({ etiqueta: 'Pago de convenio multilateral', nombreArchivo: 'convenio-multilateral.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Pago de convenio multilateral', descargado: false, motivo: pagoConvenioMultilateral.motivo });
      }

      // El usuario de ARCA es el CUIT, el mismo con el que se ingresa a AGIP.
      const declaracionJurada = await obtenerDeclaracionJuradaAGIP(contexto, usuario, claveAgip);

      if (declaracionJurada.descargado) {
        await guardarPdf(declaracionJurada.ruta, nombre, 'declaracion-jurada-agip');
        resultados.push({ etiqueta: 'Declaración jurada de AGIP', nombreArchivo: 'declaracion-jurada-agip.pdf', descargado: true });
      } else {
        resultados.push({ etiqueta: 'Declaración jurada de AGIP', descargado: false, motivo: declaracionJurada.motivo });
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
        err: { message: error instanceof Error ? error.message : String(error), stack: formatearError(error) },
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
