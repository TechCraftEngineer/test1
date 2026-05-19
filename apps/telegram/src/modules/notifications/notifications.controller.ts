import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import type { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('notifications')
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({
    summary: 'Отправить уведомление напрямую (минуя очередь, для отладки)',
  })
  async send(@Body() dto: SendNotificationDto) {
    await this.notificationsService.send(dto.text, dto.chatId);
    return { status: 'sent' };
  }
}
