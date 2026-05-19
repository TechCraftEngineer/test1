import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { TelegramModule } from './infrastructure/telegram/telegram.module';
import { HealthModule } from './presentation/health/health.module';
import { NotificationsModule } from './presentation/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TelegramModule,
    RabbitMqModule,
    HealthModule,
    NotificationsModule,
  ],
})
export class AppModule {}
