import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PublishEventService } from '../../application/services/publish-event.service';
import type { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('v1/events')
export class EventsController {
  constructor(private readonly publishEvent: PublishEventService) {}

  @Post()
  @ApiOperation({ summary: 'Опубликовать событие в RabbitMQ' })
  @ApiCreatedResponse({ description: 'Событие успешно отправлено в брокер' })
  async create(@Body() dto: CreateEventDto) {
    const event = await this.publishEvent.execute(dto);
    return {
      status: 'published',
      event,
    };
  }
}
