import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { setupSwagger } from './common/swagger/setup-swagger.js';
import { AppModule } from './app.module';

async function bootstrap() {
  // `bufferLogs: true` retiene los logs de arranque de Nest (inicio de módulos, mapeo de rutas)
  // hasta que `useLogger()` activa el `Logger` de nestjs-pino, así salen también como JSON.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, stopAtFirstError: true }),
  );
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
