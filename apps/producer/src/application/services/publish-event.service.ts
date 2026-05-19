import { Inject, Injectable } from '@nestjs/common';
import type { EventMessage } from '@repo/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  EVENT_PUBLISHER,
  type EventPublisherPort,
} from '../../domain/ports/event-publisher.port';
import type { CreateEventDto } from '../../presentation/events/dto/create-event.dto';

@Injectable()
export class PublishEventService {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly publisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateEventDto): Promise<EventMessage> {
    const event: EventMessage = {
      id: dto.id ?? uuidv4(),
      type: dto.type,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    };
    await this.publisher.publish(event);
    return event;
  }
}
