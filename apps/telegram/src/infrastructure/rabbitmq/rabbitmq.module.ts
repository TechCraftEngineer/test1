import { Module } from '@nestjs/common';
import { SendNotificationService } from '../../application/services/send-notification.service';
import { TelegramModule } from '../telegram/telegram.module';
import { RabbitMqNotificationConsumer } from './rabbitmq-notification.consumer';

@Module({
  imports: [TelegramModule],
  providers: [SendNotificationService, RabbitMqNotificationConsumer],
})
export class RabbitMqModule {}
