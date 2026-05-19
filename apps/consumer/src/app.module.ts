import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { EventProcessorService } from './infrastructure/event-processor.service';
import { IdempotencyModule } from './infrastructure/idempotency/idempotency.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    RabbitMqModule,
    IdempotencyModule,
    HealthModule,
  ],
  providers: [EventProcessorService],
})
export class AppModule {}
