import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { NotificationHandlerService } from './infrastructure/notification-handler.service';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { TelegramModule } from './infrastructure/telegram/telegram.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TelegramModule,
    RabbitMqModule,
    HealthModule,
    NotificationsModule,
  ],
  providers: [NotificationHandlerService],
})
export class AppModule {}
