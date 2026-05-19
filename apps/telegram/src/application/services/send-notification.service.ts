import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NotificationMessage } from '@repo/shared';
import {
  TELEGRAM_NOTIFIER,
  type TelegramNotifierPort,
} from '../../domain/ports/telegram-notifier.port';

@Injectable()
export class SendNotificationService {
  private readonly logger = new Logger(SendNotificationService.name);

  constructor(
    @Inject(TELEGRAM_NOTIFIER)
    private readonly telegram: TelegramNotifierPort,
  ) {}

  async execute(notification: NotificationMessage): Promise<void> {
    this.logger.log(`Sending Telegram notification for event ${notification.eventId}`);
    await this.telegram.sendMessage(notification.text);
    this.logger.log(`Telegram notification sent for event ${notification.eventId}`);
  }
}
