import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { EventProcessorService } from './event-processor.service';
import type { RabbitMqService } from './rabbitmq/rabbitmq.service';

/**
 * Связывает RabbitMqService с EventProcessorService через DI,
 * чтобы не делать это вручную в main.ts.
 */
@Injectable()
export class ConsumerBootstrapService implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMqService,
    private readonly eventProcessor: EventProcessorService,
  ) {}

  onModuleInit(): void {
    this.rabbitmq.setEventHandler((event) => this.eventProcessor.process(event));
  }
}
