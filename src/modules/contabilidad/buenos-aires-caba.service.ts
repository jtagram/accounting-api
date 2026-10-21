import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { BrowserContext, chromium, LaunchOptions, type Browser } from 'playwright';
import { GuardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { prepararCarpetaDestino } from './playwright/common/guardar-pdf/preparar-carpeta-destino.js';
import { comprimirEntradas, type EntradaZip } from './playwright/common/comprimir/comprimir-entradas.js';
import { formatearError } from './playwright/common/errores/formatear-error.js';
import { CredencialesIncorrectasError } from './playwright/common/errores/credenciales-incorrectas-error.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import type { ClienteCabaDto } from './dto/cliente-caba.dto.js';
import { ComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/comprobantes-emitidos.js';
import { ComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/comprobantes-recibidos.js';
import { Retenciones } from './playwright/modules/retenciones/retenciones.js';
import { AcuseDeRecibo } from './playwright/modules/acuse-de-recibo/acuse-de-recibo.js';
import { PagoMonotributo } from './playwright/modules/pago-monotributo/pago-monotributo.js';
import { PagoConvenioMultilateral } from './playwright/modules/pago-convenio-multilateral/pago-convenio-multilateral.js';
import { DeclaracionJuradaAgip } from './playwright/modules/declaracion-jurada-agip/declaracion-jurada-agip.js';
import { IniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';

@Injectable()
export class BuenosAiresCabaService {
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
    private readonly declaracionJuradaAgip: DeclaracionJuradaAgip,
  ) {}

  async ejecutarBuenosAiresCaba(clientes: ClienteCabaDto[]): Promise<RespuestaEjecucion> {
    const entradas: EntradaZip[] = [];

    for (const { cuit, claveFiscal, claveCiudad } of clientes) {
      entradas.push(await this.procesarCliente(cuit, claveFiscal, claveCiudad));
    }

    return {
      nombre: 'PDFs Contables',
      exito: entradas.every((entrada) => entrada.tipo === 'carpeta'),
      zip: comprimirEntradas(entradas),
    };
  }

  private async procesarCliente(cuit: string, claveFiscal: string, claveCiudad: string): Promise<EntradaZip> {
    let navegador: Browser | undefined;

    try {
      navegador = await chromium.launch(this.obtenerOpcionesDeLanzamiento());

      const contexto = await this.crearContexto(navegador);

      const pagina = await contexto.newPage();

      const nombre = await this.iniciarSesionArca.iniciarSesionArca(pagina, cuit, claveFiscal);

      const rutas = [
        await this.comprobantesEmitidos.obtenerComprobantesEmitidos(contexto, pagina),
        await this.comprobantesRecibidos.obtenerComprobantesRecibidos(contexto, pagina),
        await this.retenciones.obtenerRetenciones(contexto, pagina),
        await this.acuseDeRecibo.obtenerAcuseDeRecibo(contexto, pagina),
        await this.pagoMonotributo.obtenerPagoMonotributo(contexto, pagina),
        await this.pagoConvenioMultilateral.obtenerPagoConvenioMultilateral(contexto, pagina),
        await this.declaracionJuradaAgip.obtenerDeclaracionJuradaAGIP(contexto, cuit, claveCiudad),
      ];

      const carpeta = await prepararCarpetaDestino(this.logger, nombre);

      for (const ruta of rutas) {
        await this.guardarPdf.guardarPdf(ruta, nombre);
      }

      this.logger.log({ cuit, msg: 'Ejecución completada' });

      return { tipo: 'carpeta', ruta: carpeta, nombreEnZip: sanitizarNombre(nombre) };
    } catch (error) {
      this.logger.error({ err: error, cuit, msg: 'La ejecución falló' });

      return { tipo: 'texto', nombreEnZip: `${sanitizarNombre(cuit)}.txt`, contenido: error instanceof CredencialesIncorrectasError ? error.message : formatearError(error) };
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
