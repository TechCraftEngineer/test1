import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { ConsumerBootstrapService } from './infrastructure/consumer-bootstrap.service';
import { EventProcessorModule } from './infrastructure/event-processor.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    RabbitMqModule,
    EventProcessorModule,
    HealthModule,
  ],
  providers: [ConsumerBootstrapService],
})
export class AppModule {}
