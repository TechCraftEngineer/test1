import { Module } from '@nestjs/common';
import { PublishEventService } from '../../application/services/publish-event.service';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { EventsController } from './events.controller';

@Module({
  imports: [RabbitMqModule],
  controllers: [EventsController],
  providers: [PublishEventService],
})
export class EventsModule {}
