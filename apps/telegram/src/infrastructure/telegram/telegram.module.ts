import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TELEGRAM_NOTIFIER } from '../../domain/ports/telegram-notifier.port';
import { TelegramBotNotifier } from './telegram-bot.notifier';

@Module({
  imports: [HttpModule],
  providers: [
    TelegramBotNotifier,
    { provide: TELEGRAM_NOTIFIER, useExisting: TelegramBotNotifier },
  ],
  exports: [TELEGRAM_NOTIFIER],
})
export class TelegramModule {}
