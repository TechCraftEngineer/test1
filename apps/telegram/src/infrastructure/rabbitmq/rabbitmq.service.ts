import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type NotificationMessage, RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';

const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;
  private notificationHandler?: (notification: NotificationMessage) => Promise<void>;
  private initialized = false;
  private consuming = false;
  private isDestroyed = false;
  private reconnectAttempts = 0;

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

    this.reconnectAttempts = 0;
    this.initialized = true;
    this.logger.log('RabbitMQ connected');

    this.connection.on('error', (err) => {
      this.logger.error('RabbitMQ connection error', err);
    });

    this.connection.on('close', () => {
      if (!this.isDestroyed) {
        this.logger.warn('RabbitMQ connection closed, reconnecting...');
        this.channel = undefined;
        this.connection = undefined;
        this.initialized = false;
        this.consuming = false;
        this.consumerTag = undefined;
        void this.scheduleReconnect();
      }
    });

    if (this.notificationHandler && !this.consuming) {
      await this.startConsuming();
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.isDestroyed) return;

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `RabbitMQ reconnect failed after ${MAX_RECONNECT_ATTEMPTS} attempts. Giving up.`,
      );
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(
      `Reconnect attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY_MS}ms`,
    );

    await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));

    try {
      await this.connect();
    } catch (err) {
      this.logger.error('Reconnect attempt failed', err);
      void this.scheduleReconnect();
    }
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
    this.isDestroyed = true;
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
        `Failed to process notification ${notification.eventId}, sending to DLQ`,
        error instanceof Error ? error.stack : error,
      );
      // Отправляем в DLQ вместо простого nack — сообщение не теряется
      channel.publish(
        RABBITMQ.EXCHANGE_NOTIFICATIONS_DLX,
        RABBITMQ.ROUTING_KEY_NOTIFICATION_DLQ,
        msg.content,
        { headers: msg.properties.headers, persistent: true },
      );
      channel.ack(msg);
    }
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange(RABBITMQ.EXCHANGE_NOTIFICATIONS, 'topic', {
      durable: true,
    });
    await this.channel.assertExchange(RABBITMQ.EXCHANGE_NOTIFICATIONS_DLX, 'topic', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ.QUEUE_NOTIFICATIONS_DLQ, { durable: true });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_NOTIFICATIONS_DLQ,
      RABBITMQ.EXCHANGE_NOTIFICATIONS_DLX,
      RABBITMQ.ROUTING_KEY_NOTIFICATION_DLQ,
    );

    await this.channel.assertQueue(RABBITMQ.QUEUE_NOTIFICATIONS, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ.EXCHANGE_NOTIFICATIONS_DLX,
        'x-dead-letter-routing-key': RABBITMQ.ROUTING_KEY_NOTIFICATION_DLQ,
      },
    });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_NOTIFICATIONS,
      RABBITMQ.EXCHANGE_NOTIFICATIONS,
      RABBITMQ.ROUTING_KEY_NOTIFICATION,
    );
  }
}
