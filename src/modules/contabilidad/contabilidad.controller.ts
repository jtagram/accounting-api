import { Body, Controller, HttpStatus, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { ArcaService } from './arca.service.js';
import { ArcaAgipService } from './arca-agip.service.js';
import { ArcaArbaService } from './arca-arba.service.js';
import { ArcaDto } from './dto/arca.dto.js';
import { ArcaAgipDto } from './dto/arca-agip.dto.js';
import { ArcaArbaDto } from './dto/arca-arba.dto.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import { ApiArca, ApiArcaAgip, ApiArcaArba } from './swagger/contabilidad.swagger.js';

@Controller('contabilidad')
@ApiTags('Contabilidad')
export class ContabilidadController {
  constructor(
    private readonly arcaService: ArcaService,
    private readonly arcaAgipService: ArcaAgipService,
    private readonly arcaArbaService: ArcaArbaService,
  ) {}

  @ApiArca()
  @Post('arca')
  async arca(
    @Body() dto: ArcaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<StreamableFile> {
    const resultado = await this.arcaService.ejecutarArca(dto.clientes);

    return this.responderConZip(resultado, respuesta);
  }

  @ApiArcaAgip()
  @Post('arca-agip')
  async arcaAgip(
    @Body() dto: ArcaAgipDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<StreamableFile> {
    const resultado = await this.arcaAgipService.ejecutarArcaAgip(dto.clientes);

    return this.responderConZip(resultado, respuesta);
  }

  @ApiArcaArba()
  @Post('arca-arba')
  async arcaArba(
    @Body() dto: ArcaArbaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<StreamableFile> {
    const resultado = await this.arcaArbaService.ejecutarArcaArba(dto.clientes);

    return this.responderConZip(resultado, respuesta);
  }

  private responderConZip({ nombre, exito, zip }: RespuestaEjecucion, respuesta: Response): StreamableFile {
    respuesta.status(exito ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR);

    return new StreamableFile(zip, {
      type: 'application/zip',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(`${sanitizarNombre(nombre)}.zip`)}`,
    });
  }
}
