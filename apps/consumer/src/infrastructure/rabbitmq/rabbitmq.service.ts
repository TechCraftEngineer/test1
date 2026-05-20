import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: <explanation>
import { ConfigService } from '@nestjs/config';
import {
  type EventMessage,
  type NotificationMessage,
  RABBITMQ,
  RETRY_HEADER,
} from '@repo/shared';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;
  private eventHandler?: (event: EventMessage) => Promise<void>;
  private initialized = false;
  private consuming = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): Promise<void> {
    return this.connect();
  }

  onModuleDestroy(): Promise<void> {
    return this.disconnect();
  }

  setEventHandler(handler: (event: EventMessage) => Promise<void>): void {
    this.eventHandler = handler;
    if (this.initialized && !this.consuming) {
      void this.startConsuming();
    }
  }

  async publishNotification(notification: NotificationMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    const sent = this.channel.publish(
      RABBITMQ.EXCHANGE_NOTIFICATIONS,
      RABBITMQ.ROUTING_KEY_NOTIFICATION,
      Buffer.from(JSON.stringify(notification)),
      { persistent: true },
    );

    if (!sent) {
      throw new Error('Failed to publish notification to RabbitMQ');
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
      RABBITMQ.QUEUE_EVENTS,
      (msg) => void this.handleMessage(msg),
      { noAck: false },
    );
    this.consumerTag = consumerTag;
    this.consuming = true;
    this.logger.log('Consuming events.queue (manual ack)');
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
    if (!msg || !this.channel || !this.eventHandler) return;

    const channel = this.channel;
    let event: EventMessage;

    try {
      event = JSON.parse(msg.content.toString()) as EventMessage;
    } catch (error) {
      this.logger.error('Invalid JSON, sending to DLQ', error);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await this.eventHandler(event);
      channel.ack(msg);
      this.logger.debug(`Acknowledged ${event.id}`);
    } catch (error) {
      const retryCount = this.getRetryCount(msg);
      const maxRetries = this.config.get<number>('rabbitmq.maxRetries') ?? 3;

      this.logger.error(
        `Failed to process ${event.id} (retry ${retryCount}/${maxRetries})`,
        error instanceof Error ? error.stack : error,
      );

      if (retryCount < maxRetries) {
        const headers = { ...msg.properties.headers, [RETRY_HEADER]: retryCount + 1 };
        channel.publish(
          RABBITMQ.EXCHANGE_EVENTS_DLX,
          RABBITMQ.ROUTING_KEY_RETRY,
          msg.content,
          { headers, persistent: true },
        );
        channel.ack(msg);
        this.logger.warn(`Event ${event.id} scheduled for retry via DLX`);
      } else {
        channel.publish(
          RABBITMQ.EXCHANGE_EVENTS_DLX,
          RABBITMQ.ROUTING_KEY_DLQ,
          msg.content,
          { headers: msg.properties.headers, persistent: true },
        );
        channel.ack(msg);
        this.logger.error(`Event ${event.id} exceeded max retries → DLQ`);
      }
    }
  }

  private getRetryCount(msg: amqp.ConsumeMessage): number {
    const header = msg.properties.headers?.[RETRY_HEADER];
    if (typeof header === 'number') return header;
    if (msg.fields.redelivered) return 1;
    return 0;
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS, 'topic', {
      durable: true,
    });
    await this.channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS_DLX, 'topic', {
      durable: true,
    });
    await this.channel.assertExchange(RABBITMQ.EXCHANGE_NOTIFICATIONS, 'topic', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ.QUEUE_EVENTS_DLQ, { durable: true });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_EVENTS_DLQ,
      RABBITMQ.EXCHANGE_EVENTS_DLX,
      RABBITMQ.ROUTING_KEY_DLQ,
    );

    await this.channel.assertQueue(RABBITMQ.QUEUE_EVENTS_RETRY, {
      durable: true,
      arguments: {
        'x-message-ttl': 15000,
        'x-dead-letter-exchange': RABBITMQ.EXCHANGE_EVENTS,
        'x-dead-letter-routing-key': RABBITMQ.ROUTING_KEY_EVENT,
      },
    });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_EVENTS_RETRY,
      RABBITMQ.EXCHANGE_EVENTS_DLX,
      RABBITMQ.ROUTING_KEY_RETRY,
    );

    await this.channel.assertQueue(RABBITMQ.QUEUE_EVENTS, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ.EXCHANGE_EVENTS_DLX,
        'x-dead-letter-routing-key': RABBITMQ.ROUTING_KEY_RETRY,
      },
    });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_EVENTS,
      RABBITMQ.EXCHANGE_EVENTS,
      RABBITMQ.ROUTING_KEY_EVENT,
    );

    await this.channel.assertQueue(RABBITMQ.QUEUE_NOTIFICATIONS, { durable: true });
    await this.channel.bindQueue(
      RABBITMQ.QUEUE_NOTIFICATIONS,
      RABBITMQ.EXCHANGE_NOTIFICATIONS,
      RABBITMQ.ROUTING_KEY_NOTIFICATION,
    );
  }
}
