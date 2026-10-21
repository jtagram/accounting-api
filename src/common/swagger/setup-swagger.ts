import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Accounting RPA')
    .setDescription(
      'Automatización contable: ingresa a ARCA (y a AGIP según el cliente), descarga los PDFs del mes anterior y los devuelve en un ZIP.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, SwaggerModule.createDocument(app, config));
}
