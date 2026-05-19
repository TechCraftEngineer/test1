import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('EventPing — Consumer')
    .setDescription('Обработка событий из RabbitMQ с ack/nack и ретраями')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.CONSUMER_PORT ?? 3002;
  await app.listen(port);
}

bootstrap();
