import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { BrowserContext, chromium, LaunchOptions, type Browser } from 'playwright';
import { GuardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { prepararCarpetaDestino } from './playwright/common/guardar-pdf/preparar-carpeta-destino.js';
import { comprimirCarpeta } from './playwright/common/comprimir/comprimir-carpeta.js';
import { comprimirArchivosDeTexto } from './playwright/common/comprimir/comprimir-archivos-de-texto.js';
import { formatearError } from './playwright/common/errores/formatear-error.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import { ComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/comprobantes-emitidos.js';
import { ComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/comprobantes-recibidos.js';
import { Retenciones } from './playwright/modules/retenciones/retenciones.js';
import { AcuseDeRecibo } from './playwright/modules/acuse-de-recibo/acuse-de-recibo.js';
import { PagoMonotributo } from './playwright/modules/pago-monotributo/pago-monotributo.js';
import { PagoConvenioMultilateral } from './playwright/modules/pago-convenio-multilateral/pago-convenio-multilateral.js';
import { DeclaracionJuradaArca } from './playwright/modules/declaracion-jurada-arca/declaracion-jurada-arca.js';
import { IniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';

@Injectable()
export class BuenosAiresService {
  constructor(
    private readonly logger: Logger,
    private readonly iniciarSesionArca: IniciarSesionArca,
    private readonly guardarPdf: GuardarPdf,
    private readonly comprobantesEmitidos: ComprobantesEmitidos,
    private readonly comprobantesRecibidos: ComprobantesRecibidos,
    private readonly retenciones: Retenciones,
    private readonly acuseDeRecibo: AcuseDeRecibo,
    private readonly pagoMonotributo: PagoMonotributo,
    private readonly pagoConvenioMultilateral: PagoConvenioMultilateral,
    private readonly declaracionJuradaArca: DeclaracionJuradaArca,
  ) {}

  async ejecutarBuenosAires(cuit: string, claveFiscal: string): Promise<RespuestaEjecucion> {
    let navegador: Browser | undefined;

    try {
      navegador = await chromium.launch(this.obtenerOpcionesDeLanzamiento());

      const contexto = await this.crearContexto(navegador);

      const pagina = await contexto.newPage();

     let nombre = await this.iniciarSesionArca.iniciarSesionArca(pagina, cuit, claveFiscal);

      const rutas = [
        await this.comprobantesEmitidos.obtenerComprobantesEmitidos(contexto, pagina),
        await this.comprobantesRecibidos.obtenerComprobantesRecibidos(contexto, pagina),
        await this.retenciones.obtenerRetenciones(contexto, pagina),
        await this.acuseDeRecibo.obtenerAcuseDeRecibo(contexto, pagina),
        await this.pagoMonotributo.obtenerPagoMonotributo(contexto, pagina),
        await this.pagoConvenioMultilateral.obtenerPagoConvenioMultilateral(contexto, pagina),
        await this.declaracionJuradaArca.obtenerDeclaracionJuradaArca(contexto, pagina),
      ];

      const carpeta = await prepararCarpetaDestino(this.logger, nombre);

      for (const ruta of rutas) {
        await this.guardarPdf.guardarPdf(ruta, nombre);
      }

      this.logger.log('Ejecución completada');

      return { nombre, exito: true, zip: comprimirCarpeta(carpeta, sanitizarNombre(nombre)) };
    } catch (error) {
      this.logger.error({ err: error, msg: 'La ejecución falló' });

      const archivoError = { nombre: `${sanitizarNombre(cuit)}.txt`, contenido: formatearError(error) };

      return { nombre: cuit, exito: false, zip: comprimirArchivosDeTexto(sanitizarNombre(cuit), [archivoError]) };
    } finally {
      await navegador?.close().catch(() => undefined);
    }
  }

  private obtenerOpcionesDeLanzamiento(): LaunchOptions {
    return {
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      slowMo: 100,
    };
  }

  private async crearContexto(navegador: Browser): Promise<BrowserContext> {
    const contextoTemporal = await navegador.newContext();
    const paginaTemporal = await contextoTemporal.newPage();
    const userAgent = (await paginaTemporal.evaluate<string>('navigator.userAgent')).replace('HeadlessChrome', 'Chrome');
    await contextoTemporal.close();
  
    return navegador.newContext({
      userAgent,
      locale: 'es-AR',
      timezoneId: 'America/Argentina/Buenos_Aires',
    });
  }
  
}
