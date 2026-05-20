import { Injectable, type OnModuleInit } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

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
