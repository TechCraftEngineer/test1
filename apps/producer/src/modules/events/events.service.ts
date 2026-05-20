import { Injectable, Logger } from '@nestjs/common';
import type { EventMessage } from '@repo/shared';
import { v7 as uuidv7 } from 'uuid';
import { RabbitMqService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import type { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly rabbitmq: RabbitMqService) {}

  async publish(dto: CreateEventDto): Promise<EventMessage> {
    const event: EventMessage = {
      id: dto.id ?? uuidv7(),
      type: dto.type,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    };

    await this.rabbitmq.publishEvent(event);
    this.logger.log(`Event published: ${event.id} [${event.type}]`);

    return event;
  }
}
