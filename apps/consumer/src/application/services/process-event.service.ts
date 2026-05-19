import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EventMessage, NotificationMessage } from '@repo/shared';
import {
  IDEMPOTENCY_STORE,
  type IdempotencyStorePort,
} from '../../domain/ports/idempotency-store.port';
import {
  NOTIFICATION_PUBLISHER,
  type NotificationPublisherPort,
} from '../../domain/ports/notification-publisher.port';

@Injectable()
export class ProcessEventService {
  private readonly logger = new Logger(ProcessEventService.name);

  constructor(
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotency: IdempotencyStorePort,
    @Inject(NOTIFICATION_PUBLISHER)
    private readonly notificationPublisher: NotificationPublisherPort,
  ) {}

  async execute(event: EventMessage): Promise<void> {
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

      await this.notificationPublisher.publish(notification);
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
