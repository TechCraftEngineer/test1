import { Module } from '@nestjs/common';
import { NotificationHandlerService } from './notification-handler.service';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [NotificationHandlerService],
  exports: [NotificationHandlerService],
})
export class NotificationHandlerModule {}
