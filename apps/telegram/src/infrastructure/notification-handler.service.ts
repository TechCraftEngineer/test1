import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationMessage } from '@repo/shared';
import { TelegramService } from './telegram/telegram.service';

const RETRY_DELAYS_MS = [1_000, 3_000, 10_000] as const;

@Injectable()
export class NotificationHandlerService {
  private readonly logger = new Logger(NotificationHandlerService.name);
  private readonly maxRetries: number;

  constructor(
    private readonly telegram: TelegramService,
    config: ConfigService,
  ) {
    this.maxRetries =
      config.get<number>('telegram.sendRetries') ?? RETRY_DELAYS_MS.length;
  }

  async handle(notification: NotificationMessage): Promise<void> {
    this.logger.log(`Processing notification for event ${notification.eventId}`);

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.telegram.sendMessage(notification.text);
        this.logger.log(`Notification sent for event ${notification.eventId}`);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const delayMs =
            RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
          this.logger.warn(
            `Telegram send failed for event ${notification.eventId} (attempt ${attempt + 1}/${this.maxRetries + 1}), retrying in ${delayMs}ms`,
            error instanceof Error ? error.message : error,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.error(
      `Telegram send failed for event ${notification.eventId} after ${this.maxRetries + 1} attempts`,
      lastError instanceof Error ? lastError.stack : lastError,
    );
    throw lastError;
  }
}
