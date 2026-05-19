import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '../../infrastructure/telegram/telegram.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly telegram: TelegramService) {}

  async send(text: string, chatId?: string): Promise<void> {
    this.logger.log('Sending notification via Telegram');
    await this.telegram.sendMessage(text, chatId);
    this.logger.log('Notification sent successfully');
  }
}
