import { Injectable, Logger } from '@nestjs/common';
import type { NotificationMessage } from '@repo/shared';
import { TelegramService } from './telegram/telegram.service';

@Injectable()
export class NotificationHandlerService {
  private readonly logger = new Logger(NotificationHandlerService.name);

  constructor(private readonly telegram: TelegramService) {}

  async handle(notification: NotificationMessage): Promise<void> {
    this.logger.log(`Processing notification for event ${notification.eventId}`);
    await this.telegram.sendMessage(notification.text);
    this.logger.log(`Notification sent for event ${notification.eventId}`);
  }
}
