import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import type { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Опубликовать событие в RabbitMQ' })
  @ApiCreatedResponse({ description: 'Событие успешно отправлено в брокер' })
  async create(@Body() dto: CreateEventDto) {
    const event = await this.eventsService.publish(dto);
    return {
      status: 'published',
      event,
    };
  }
}
