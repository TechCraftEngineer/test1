import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { type EventMessage, RABBITMQ } from '@repo/shared';
import * as amqp from 'amqplib';
import type { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { assertEventsTopology } from './rabbitmq-topology';

@Injectable()
export class RabbitMqEventPublisher
  implements EventPublisherPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqEventPublisher.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<void> {
    const url = this.config.get<string>('rabbitmq.url');
    if (!url) {
      throw new Error('rabbitmq.url is not configured');
    }
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createConfirmChannel();
    await assertEventsTopology(this.channel);
    this.logger.log('RabbitMQ publisher connected');
  }

  async publish(event: EventMessage): Promise<void> {
    const retries = this.config.get<number>('rabbitmq.publishRetries') ?? 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.publishOnce(event);
        this.logger.log(`Event ${event.id} published (attempt ${attempt})`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Publish failed for ${event.id} (attempt ${attempt}/${retries}): ${lastError.message}`,
        );
        if (attempt < retries) {
          await this.reconnect();
          await this.delay(attempt * 500);
        }
      }
    }

    throw lastError ?? new Error('Failed to publish event');
  }

  private async publishOnce(event: EventMessage): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }
    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel is not available');
    }
    const body = Buffer.from(JSON.stringify(event));

    await new Promise<void>((resolve, reject) => {
      channel.publish(
        RABBITMQ.EXCHANGE_EVENTS,
        RABBITMQ.ROUTING_KEY_EVENT,
        body,
        {
          contentType: 'application/json',
          persistent: true,
          messageId: event.id,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  private async reconnect(): Promise<void> {
    try {
      await this.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.connection?.close();
    } catch {
      /* ignore */
    }
    this.channel = undefined;
    this.connection = undefined;
    await this.connect();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
