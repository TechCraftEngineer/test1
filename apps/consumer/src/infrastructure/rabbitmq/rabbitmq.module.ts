import { Module } from '@nestjs/common';
import { ProcessEventService } from '../../application/services/process-event.service';
import { IDEMPOTENCY_STORE } from '../../domain/ports/idempotency-store.port';
import { NOTIFICATION_PUBLISHER } from '../../domain/ports/notification-publisher.port';
import { InMemoryIdempotencyStore } from '../idempotency/in-memory-idempotency.store';
import { RabbitMqEventConsumer } from './rabbitmq-event.consumer';
import { RabbitMqNotificationPublisher } from './rabbitmq-notification.publisher';

@Module({
  providers: [
    ProcessEventService,
    InMemoryIdempotencyStore,
    { provide: IDEMPOTENCY_STORE, useExisting: InMemoryIdempotencyStore },
    RabbitMqNotificationPublisher,
    {
      provide: NOTIFICATION_PUBLISHER,
      useExisting: RabbitMqNotificationPublisher,
    },
    RabbitMqEventConsumer,
  ],
})
export class RabbitMqModule {}
