import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Отправить уведомление напрямую (минуя очередь, для отладки)',
  })
  @ApiOkResponse({ schema: { example: { status: 'sent' } } })
  async send(@Body() dto: SendNotificationDto): Promise<{ status: string }> {
    await this.notificationsService.send(dto.text, dto.chatId);
    return { status: 'sent' };
  }
}
