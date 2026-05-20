import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Wiring RabbitMQ → NotificationHandlerService выполняется через NotificationBootstrapService (OnModuleInit).

  const config = new DocumentBuilder()
    .setTitle('EventPing — Telegram')
    .setDescription('Отправка уведомлений в Telegram через Bot API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = app.get(ConfigService).get<number>('port') ?? 3003;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Telegram service failed to start', error);
  process.exit(1);
});
