import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationMessage, RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;
  private notificationHandler?: (notification: NotificationMessage) => Promise<void>;
  private initialized = false;
  private consuming = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): Promise<void> {
    return this.connect();
  }

  onModuleDestroy(): Promise<void> {
    return this.disconnect();
  }

  setNotificationHandler(
    handler: (notification: NotificationMessage) => Promise<void>,
  ): void {
    this.notificationHandler = handler;
    if (this.initialized && !this.consuming) {
      this.startConsuming().catch((err) => {
        this.logger.error('Failed to start consuming notifications', err);
      });
    }
  }

  private async connect(): Promise<void> {
    const url = this.config.get<string>('rabbitmq.url');
    if (!url) {
      throw new Error('rabbitmq.url is not configured');
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.setupTopology();

    const prefetch = this.config.get<number>('rabbitmq.prefetch') ?? 10;
    await this.channel.prefetch(prefetch);

    this.initialized = true;
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel || this.consuming) return;

    const { consumerTag } = await this.channel.consume(
      RABBITMQ.QUEUE_NOTIFICATIONS,
      (msg) => void this.handleMessage(msg),
      { noAck: false },
    );
    this.consumerTag = consumerTag;
    this.consuming = true;
    this.logger.log('Consuming notifications.queue (manual ack)');
  }

  private async disconnect(): Promise<void> {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
    }
    await this.channel?.close();
    await this.connection?.close();
    this.logger.log('RabbitMQ disconnected');
  }

  private async handleMessage(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel || !this.notificationHandler) return;

    const channel = this.channel;
    let notification: NotificationMessage;

    try {
      notification = JSON.parse(msg.content.toString()) as NotificationMessage;
    } catch (error) {
      this.logger.error('Invalid JSON, message discarded', error);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await this.notificationHandler(notification);
      channel.ack(msg);
      this.logger.debug(`Acknowledged notification ${notification.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process notification ${notification.eventId}`,
        error instanceof Error ? error.stack : error,
      );
      channel.nack(msg, false, false);
    }
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange(RABBITMQ.EXCHANGE_NOTIFICATIONS, 'topic', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ.QUEUE_NOTIFICATIONS, { durable: true });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_NOTIFICATIONS,
      RABBITMQ.EXCHANGE_NOTIFICATIONS,
      RABBITMQ.ROUTING_KEY_NOTIFICATION,
    );
  }
}
