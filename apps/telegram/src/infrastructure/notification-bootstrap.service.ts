import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { NotificationHandlerService } from './notification-handler.service';
import type { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Связывает RabbitMqService с NotificationHandlerService через DI,
 * чтобы не делать это вручную в main.ts.
 */
@Injectable()
export class NotificationBootstrapService implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMqService,
    private readonly notificationHandler: NotificationHandlerService,
  ) {}

  onModuleInit(): void {
    this.rabbitmq.setNotificationHandler((notification) =>
      this.notificationHandler.handle(notification),
    );
  }
}
