import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { NotificationBootstrapService } from './infrastructure/notification-bootstrap.service';
import { NotificationHandlerService } from './infrastructure/notification-handler.service';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { TelegramModule } from './infrastructure/telegram/telegram.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '../../.env',
    }),
    TelegramModule,
    RabbitMqModule,
    HealthModule,
    NotificationsModule,
  ],
  providers: [NotificationHandlerService, NotificationBootstrapService],
})
export class AppModule {}
