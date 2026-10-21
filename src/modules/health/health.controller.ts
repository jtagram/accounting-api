import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Estado del servicio',
    description: 'Lo usan los probes de Kubernetes para saber si la aplicación está levantada.',
  })
  @ApiOkResponse({ description: 'El servicio está en pie.', schema: { example: { status: 'ok' } } })
  verificar() {
    return { status: 'ok' };
  }
}
