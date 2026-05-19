import { Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../../domain/ports/event-publisher.port';
import { RabbitMqEventPublisher } from './rabbitmq-event.publisher';

@Module({
  providers: [
    RabbitMqEventPublisher,
    { provide: EVENT_PUBLISHER, useExisting: RabbitMqEventPublisher },
  ],
  exports: [EVENT_PUBLISHER, RabbitMqEventPublisher],
})
export class RabbitMqModule {}
