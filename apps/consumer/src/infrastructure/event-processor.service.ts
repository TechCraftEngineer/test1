import { Injectable, Logger } from '@nestjs/common';
import type { EventMessage, NotificationMessage } from '@repo/shared';
import { IdempotencyService } from './idempotency/idempotency.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    private readonly idempotency: IdempotencyService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  async process(event: EventMessage): Promise<void> {
    if (!this.idempotency.claim(event.id)) {
      this.logger.warn(`Duplicate event skipped: ${event.id}`);
      return;
    }

    this.logger.log(`Processing event ${event.id} [${event.type}]`);

    try {
      if (event.type === 'simulate.failure') {
        throw new Error(`Simulated failure for event ${event.id}`);
      }

      const notification: NotificationMessage = {
        eventId: event.id,
        channel: 'telegram',
        text: this.formatNotification(event),
        sourceEvent: event,
      };

      await this.rabbitmq.publishNotification(notification);
      this.logger.log(`Event ${event.id} processed successfully`);
    } catch (error) {
      this.idempotency.release(event.id);
      throw error;
    }
  }

  private formatNotification(event: EventMessage): string {
    return [
      `📩 Событие: ${event.type}`,
      `🆔 ID: ${event.id}`,
      `🕐 ${event.createdAt}`,
      `📦 ${JSON.stringify(event.payload, null, 2)}`,
    ].join('\n');
  }
}
