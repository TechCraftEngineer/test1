import { Module } from '@nestjs/common';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [RabbitMqModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
