import { Injectable, Logger } from '@nestjs/common';
import type { NotificationMessage } from '@repo/shared';
import { NotificationHandlerService } from '../../infrastructure/notification-handler.service';

/**
 * HTTP-фасад для ручной отправки уведомлений (отладка / интеграционные вызовы).
 * Делегирует в NotificationHandlerService, чтобы retry-логика была единой.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly handler: NotificationHandlerService) {}

  async send(text: string, chatId?: string): Promise<void> {
    this.logger.log('Sending notification via HTTP endpoint');

    const notification: NotificationMessage = {
      eventId: `manual-${Date.now()}`,
      channel: 'telegram',
      text,
      sourceEvent: {
        id: `manual-${Date.now()}`,
        type: 'manual.send',
        payload: chatId ? { chatId } : {},
        createdAt: new Date().toISOString(),
      },
    };

    await this.handler.handle(notification);
  }
}
