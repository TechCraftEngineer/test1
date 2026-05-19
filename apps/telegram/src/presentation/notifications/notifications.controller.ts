import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  TELEGRAM_NOTIFIER,
  type TelegramNotifierPort,
} from '../../domain/ports/telegram-notifier.port';
import type { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('notifications')
@Controller('v1/notifications')
export class NotificationsController {
  constructor(
    @Inject(TELEGRAM_NOTIFIER)
    private readonly telegram: TelegramNotifierPort,
  ) {}

  @Post('send')
  @ApiOperation({
    summary: 'Отправить уведомление напрямую (минуя очередь, для отладки)',
  })
  async send(@Body() dto: SendNotificationDto) {
    await this.telegram.sendMessage(dto.text, dto.chatId);
    return { status: 'sent' };
  }
}
