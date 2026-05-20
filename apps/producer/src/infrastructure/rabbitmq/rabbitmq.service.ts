import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EventMessage } from '@repo/shared';
import { RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
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
    await this.setupTopology();

    this.logger.log('RabbitMQ connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.logger.log('RabbitMQ disconnected');
  }

  async publishEvent(event: EventMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    const sent = this.channel.publish(
      RABBITMQ.EXCHANGE_EVENTS,
      RABBITMQ.ROUTING_KEY_EVENT,
      Buffer.from(JSON.stringify(event)),
      { persistent: true },
    );

    if (!sent) {
      const channel = this.channel;
      await new Promise<void>((resolve) => channel.once('drain', resolve));
    }

    await this.channel.waitForConfirms();
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS, 'topic', {
      durable: true,
    });
    await this.channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS_DLX, 'topic', {
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
        'x-message-ttl': 5000,
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
  }
}
