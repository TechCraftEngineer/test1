import { Module } from '@nestjs/common';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TelegramModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
