import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Consumer — headless сервис без публичного HTTP API.
  // Wiring RabbitMQ → EventProcessorService выполняется через ConsumerBootstrapService (OnModuleInit).

  const port = app.get(ConfigService).get<number>('port') ?? 3002;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Consumer failed to start', error);
  process.exit(1);
});
