import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
