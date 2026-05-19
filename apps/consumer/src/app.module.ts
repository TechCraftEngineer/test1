import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { HealthModule } from './presentation/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    RabbitMqModule,
    HealthModule,
  ],
})
export class AppModule {}
