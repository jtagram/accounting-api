import { Body, Controller, HttpStatus, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { sanitizarNombre } from './playwright/common/guardar-pdf/carpeta-destino.js';
import { BuenosAiresService } from './buenos-aires.service.js';
import { BuenosAiresCabaService } from './buenos-aires-caba.service.js';
import { BuenosAiresDto } from './dto/buenos-aires.dto.js';
import { BuenosAiresCabaDto } from './dto/buenos-aires-caba.dto.js';
import type { RespuestaEjecucion } from './respuesta-ejecucion.js';
import { ApiBuenosAires, ApiBuenosAiresCaba } from './swagger/contabilidad.swagger.js';

@Controller('contabilidad')
@ApiTags('Contabilidad')
export class ContabilidadController {
  constructor(
    private readonly buenosAiresService: BuenosAiresService,
    private readonly buenosAiresCabaService: BuenosAiresCabaService,
  ) {}

  @ApiBuenosAires()
  @Post('buenos-aires')
  async buenosAires(
    @Body() dto: BuenosAiresDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<StreamableFile> {
    const resultado = await this.buenosAiresService.ejecutarBuenosAires(dto.ARCA_USERNAME, dto.ARCA_PASSWORD);

    return this.responderConZip(resultado, respuesta);
  }

  @ApiBuenosAiresCaba()
  @Post('buenos-aires-caba')
  async buenosAiresCaba(
    @Body() dto: BuenosAiresCabaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<StreamableFile> {
    const resultado = await this.buenosAiresCabaService.ejecutarBuenosAiresCaba(
      dto.ARCA_USERNAME,
      dto.ARCA_PASSWORD,
      dto.AGIP_CLAVE,
    );

    return this.responderConZip(resultado, respuesta);
  }

  private responderConZip({ nombre, exito, zip }: RespuestaEjecucion, respuesta: Response): StreamableFile {
    // Si algo falló el ZIP trae solo el error, pero el status lo deja en evidencia.
    respuesta.status(exito ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR);

    return new StreamableFile(zip, {
      type: 'application/zip',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(`${sanitizarNombre(nombre)}.zip`)}`,
    });
  }
}
