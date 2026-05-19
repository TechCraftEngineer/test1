import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { type NotificationMessage, RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';
import type { SendNotificationService } from '../../application/services/send-notification.service';
import { assertTelegramTopology } from './rabbitmq-topology';

@Injectable()
export class RabbitMqNotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqNotificationConsumer.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly sendNotification: SendNotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('rabbitmq.url');
    if (!url) {
      throw new Error('rabbitmq.url is not configured');
    }
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await assertTelegramTopology(this.channel);

    const prefetch = this.config.get<number>('rabbitmq.prefetch') ?? 10;
    await this.channel.prefetch(prefetch);

    const { consumerTag } = await this.channel.consume(
      RABBITMQ.QUEUE_NOTIFICATIONS,
      (msg) => void this.handleMessage(msg),
      { noAck: false },
    );
    this.consumerTag = consumerTag;
    this.logger.log('Consuming notifications.queue (manual ack)');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
    }
    await this.channel?.close();
    await this.connection?.close();
  }

  private async handleMessage(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;

    const channel = this.channel;
    let notification: NotificationMessage;

    try {
      notification = JSON.parse(msg.content.toString()) as NotificationMessage;
    } catch (error) {
      this.logger.error('Invalid notification JSON', error);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await this.sendNotification.execute(notification);
      channel.ack(msg);
      this.logger.log(`Notification for ${notification.eventId} acknowledged`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification for ${notification.eventId}`,
        error instanceof Error ? error.stack : error,
      );
      channel.nack(msg, false, true);
    }
  }
}
