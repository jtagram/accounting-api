import type { BrowserContext, Page } from 'playwright';
import type { Logger } from 'nestjs-pino';
import { construirErrorParaLog } from '../../../common/errores/construir-error-para-log.js';
import { irAPaginaServicioComarb } from './ir-a-pagina-servicio-comarb.js';

export async function irAPaginaConsultasSifere(logger: Logger, contexto: BrowserContext, pagina: Page): Promise<Page> {
  try {
    const enlaceSifereWebConsultas = pagina.locator('a[title="comarb_sifereweb_consultas"]');
    const usaSifereWebConsultas = await enlaceSifereWebConsultas.isVisible();
    const nombreServicio = usaSifereWebConsultas ? 'comarb_sifereweb_consultas' : 'comarb_sircreb_contrib';

    const paginaConsultasSifere = await irAPaginaServicioComarb(logger, contexto, pagina, nombreServicio);

    logger.log({ nombreServicio, msg: 'Consultas SIFERE abierto' });

    return paginaConsultasSifere;
  } catch (error) {
    logger.error({ err: construirErrorParaLog(error), msg: 'No se pudo abrir Consultas SIFERE' });
    throw new Error('No se pudo abrir Consultas SIFERE', { cause: error });
  }
}
