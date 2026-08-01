import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { cronsEnabled } from './common/crons';
import { MulterExceptionFilter } from './common/multer-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new MulterExceptionFilter());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Supracarer API')
    .setDescription('Caregiver scheduling platform — Ghana MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);

  // Surface cron state — when disabled, scheduled jobs skip all DB work so a
  // scale-to-zero database (Neon) can stay suspended and not accrue charges.
  console.log(
    `[startup] Scheduled crons ${cronsEnabled() ? 'ENABLED' : 'DISABLED (set CRONS_ENABLED=true to run)'}`,
  );
}
void bootstrap();
