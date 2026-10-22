import { Module } from '@nestjs/common';
import { ContabilidadController } from './contabilidad.controller.js';
import { ArcaService } from './arca.service.js';
import { ComprobantesEmitidos } from './playwright/modules/comprobantes-emitidos/comprobantes-emitidos.js';
import { ComprobantesRecibidos } from './playwright/modules/comprobantes-recibidos/comprobantes-recibidos.js';
import { Retenciones } from './playwright/modules/retenciones/retenciones.js';
import { AcuseDeReciboArca } from './playwright/modules/acuse-de-recibo-arca/acuse-de-recibo-arca.js';
import { PagoMonotributo } from './playwright/modules/pago-monotributo/pago-monotributo.js';
import { IngresosBrutos } from './playwright/modules/ingresos-brutos/ingresos-brutos.js';
import { DeclaracionJuradaArca } from './playwright/modules/declaracion-jurada-arca/declaracion-jurada-arca.js';
import { GuardarPdf } from './playwright/common/guardar-pdf/guardar-pdf.js';
import { DeclaracionJuradaAgip } from './playwright/modules/declaracion-jurada-agip/declaracion-jurada-agip.js';
import { IniciarSesionArca } from './playwright/common/inicio-de-sesion/iniciar-sesion-arca.js';
import { ArcaAgipService } from './arca-agip.service.js';
import { ArcaArbaService } from './arca-arba.service.js';
import { AcuseDeReciboArba } from './playwright/modules/acuse-de-recibo-arba/acuse-de-recibo-arba.js';
import { DeclaracionJuradaArba } from './playwright/modules/declaracion-jurada-arba/declaracion-jurada-arba.js';

@Module({
  controllers: [ContabilidadController],
  providers: [ArcaService, ArcaAgipService, ArcaArbaService, AcuseDeReciboArba, DeclaracionJuradaArba,IniciarSesionArca, GuardarPdf, ComprobantesEmitidos, ComprobantesRecibidos, Retenciones, AcuseDeReciboArca, PagoMonotributo, IngresosBrutos, DeclaracionJuradaArca, DeclaracionJuradaAgip],
})
export class ContabilidadModule {}
