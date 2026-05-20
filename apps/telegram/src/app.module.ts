import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@repo/health';
import configuration from './common/config/configuration';
import { NotificationBootstrapService } from './infrastructure/notification-bootstrap.service';
import { NotificationHandlerModule } from './infrastructure/notification-handler.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '../../.env',
    }),
    NotificationHandlerModule,
    RabbitMqModule,
    HealthModule.forService('telegram'),
    NotificationsModule,
  ],
  providers: [NotificationBootstrapService],
})
export class AppModule {}
