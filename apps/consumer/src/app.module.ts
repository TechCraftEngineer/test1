import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@repo/health';
import configuration from './common/config/configuration';
import { ConsumerBootstrapService } from './infrastructure/consumer-bootstrap.service';
import { EventProcessorModule } from './infrastructure/event-processor.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: path.resolve(__dirname, '../../.env'),
    }),
    RabbitMqModule,
    EventProcessorModule,
    HealthModule.forService('consumer'),
  ],
  providers: [ConsumerBootstrapService],
})
export class AppModule {}
