import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NotificationMessage } from '@repo/shared';
import { AppModule } from './app.module';
import { NotificationHandlerService } from './infrastructure/notification-handler.service';
import { RabbitMqService } from './infrastructure/rabbitmq/rabbitmq.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('EventPing — Telegram')
    .setDescription('Отправка уведомлений в Telegram через Bot API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const notificationHandler = app.get(NotificationHandlerService);
  const rabbitmq = app.get(RabbitMqService);
  rabbitmq.setNotificationHandler((notification: NotificationMessage) => notificationHandler.handle(notification));

  const port = parseInt(process.env.TELEGRAM_PORT ?? '3003', 10);
  await app.listen(port);
}

bootstrap();
