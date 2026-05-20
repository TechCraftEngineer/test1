import { Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [IdempotencyModule, RabbitMqModule],
  providers: [EventProcessorService],
  exports: [EventProcessorService],
})
export class EventProcessorModule {}
