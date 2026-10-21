import { Module } from '@nestjs/common';
import { ContabilidadController } from './contabilidad.controller.js';
import { BuenosAiresService } from './buenos-aires.service.js';
import { ComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/comprobantes-emitidos.js';
import { ComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/comprobantes-recibidos.js';
import { Retenciones } from './playwright/modules/retenciones/retenciones.js';
import { AcuseDeRecibo } from './playwright/modules/acuse-de-recibo/acuse-de-recibo.js';
import { PagoMonotributo } from './playwright/modules/pago-monotributo/pago-monotributo.js';
import { PagoConvenioMultilateral } from './playwright/modules/pago-convenio-multilateral/pago-convenio-multilateral.js';
import { DeclaracionJuradaArca } from './playwright/modules/declaracion-jurada-arca/declaracion-jurada-arca.js';
import { GuardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { DeclaracionJuradaAgip } from './playwright/modules/declaracion-jurada-agip/declaracion-jurada-agip.js';
import { IniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';
import { BuenosAiresCabaService } from './buenos-aires-caba.service.js';

@Module({
  controllers: [ContabilidadController],
  providers: [BuenosAiresService, BuenosAiresCabaService, IniciarSesionArca, GuardarPdf, ComprobantesEmitidos, ComprobantesRecibidos, Retenciones, AcuseDeRecibo, PagoMonotributo, PagoConvenioMultilateral, DeclaracionJuradaArca, DeclaracionJuradaAgip],
})
export class ContabilidadModule {}
