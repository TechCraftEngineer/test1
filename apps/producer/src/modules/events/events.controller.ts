import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Опубликовать событие в RabbitMQ' })
  @ApiCreatedResponse({
    type: EventResponseDto,
    description: 'Событие успешно отправлено в брокер',
  })
  async create(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    const event = await this.eventsService.publish(dto);
    return { status: 'published', event };
  }
}
