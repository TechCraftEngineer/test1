import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type EventMessage, RABBITMQ, RETRY_HEADER } from '@repo/shared';
import * as amqp from 'amqplib';
import { ProcessEventService } from '../../application/services/process-event.service';
import { assertConsumerTopology } from './rabbitmq-topology';

@Injectable()
export class RabbitMqEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqEventConsumer.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly processEvent: ProcessEventService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('rabbitmq.url');
    if (!url) {
      throw new Error('rabbitmq.url is not configured');
    }
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await assertConsumerTopology(this.channel);

    const prefetch = this.config.get<number>('rabbitmq.prefetch') ?? 10;
    await this.channel.prefetch(prefetch);

    const { consumerTag } = await this.channel.consume(
      RABBITMQ.QUEUE_EVENTS,
      (msg) => void this.handleMessage(msg),
      { noAck: false },
    );
    this.consumerTag = consumerTag;
    this.logger.log('Consuming events.queue (manual ack)');
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
    let event: EventMessage;

    try {
      event = JSON.parse(msg.content.toString()) as EventMessage;
    } catch (error) {
      this.logger.error('Invalid JSON, sending to DLQ', error);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await this.processEvent.execute(event);
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
        channel.nack(msg, false, false);
        this.logger.warn(`Event ${event.id} scheduled for retry via DLX`);
      } else {
        channel.nack(msg, false, false);
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
}
