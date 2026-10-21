import type { BrowserContext } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../common/errores/construir-error-para-log.js';
import { descargado, noDisponible, type ResultadoObtencion } from '../../common/resultado/resultado-obtencion.js';
import { irAPaginaAGIP } from './ir-a-pagina-agip.js';
import { iniciarSesion } from './iniciar-sesion.js';
import { irAPaginaESicol } from './ir-a-pagina-e-sicol.js';
import { abrirDeclaracionesJuradasPresentadas } from './abrir-declaraciones-juradas-presentadas.js';
import { seleccionarMesAnteriorDeclaracionJurada } from './seleccionar-mes-anterior-declaracion-jurada.js';
import { imprimirDeclaracionJurada } from './imprimir-declaracion-jurada.js';
import { descargarPdfDeclaracionJurada } from './descargar-pdf-declaracion-jurada.js';

export async function obtenerDeclaracionJuradaAGIP(logger: Logger, contexto: BrowserContext, cuit: string, clave: string): Promise<ResultadoObtencion> {
  logger.log({ cuit, msg: 'Obteniendo declaración jurada de AGIP' });

  try {
    const paginaAgip = await irAPaginaAGIP(logger, contexto);

    await iniciarSesion(logger, paginaAgip, cuit, clave);

    const paginaESicol = await irAPaginaESicol(logger, contexto, paginaAgip);

    await abrirDeclaracionesJuradasPresentadas(logger, paginaESicol);

    const encontrada = await seleccionarMesAnteriorDeclaracionJurada(logger, paginaESicol);

    if (!encontrada) {
      await paginaESicol.close();
      await paginaAgip.close();

      const motivo = 'No se encontró una DDJJ presentada para el período buscado en AGIP';

      logger.warn({ motivo, msg: 'PDF no disponible: Declaración jurada de AGIP' });

      return noDisponible(motivo);
    }

    const urlPdf = await imprimirDeclaracionJurada(logger, contexto, paginaESicol);

    const rutaPdf = await descargarPdfDeclaracionJurada(logger, contexto, urlPdf);

    await paginaESicol.close();
    await paginaAgip.close();

    logger.log({ cuit, msg: 'Declaración jurada de AGIP descargado' });

    return descargado(rutaPdf);
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), cuit, msg: 'No se pudo obtener la declaración jurada de AGIP' });
    throw error;
  }
}
