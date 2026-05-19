import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('EventPing — Producer')
    .setDescription('Публикация событий в RabbitMQ с подтверждением доставки')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PRODUCER_PORT ?? 3001;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Producer failed to start', error);
  process.exit(1);
});
