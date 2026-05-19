import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { type NotificationMessage, RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';
import type { NotificationPublisherPort } from '../../domain/ports/notification-publisher.port';
import { assertConsumerTopology } from './rabbitmq-topology';

@Injectable()
export class RabbitMqNotificationPublisher
  implements NotificationPublisherPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqNotificationPublisher.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('rabbitmq.url');
    if (!url) {
      throw new Error('rabbitmq.url is not configured');
    }
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createConfirmChannel();
    await assertConsumerTopology(this.channel);
    this.logger.log('Notification publisher connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(notification: NotificationMessage): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel is not available');
    }
    const body = Buffer.from(JSON.stringify(notification));

    await new Promise<void>((resolve, reject) => {
      channel.publish(
        RABBITMQ.EXCHANGE_NOTIFICATIONS,
        RABBITMQ.ROUTING_KEY_NOTIFICATION,
        body,
        {
          contentType: 'application/json',
          persistent: true,
          messageId: notification.eventId,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }
}
