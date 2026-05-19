import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async sendMessage(text: string, chatId?: string): Promise<void> {
    const token = this.config.get<string>('telegram.botToken');
    const defaultChatId = this.config.get<string>('telegram.chatId');
    const targetChatId = chatId ?? defaultChatId;

    if (!token || !targetChatId) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured');
    }

    const configuredBaseUrl = this.config.get<string>('telegram.apiBaseUrl');
    const baseUrl = (configuredBaseUrl?.trim() || 'https://api.telegram.org').replace(
      /\/+$/,
      '',
    );
    const url = `${baseUrl}/bot${token}/sendMessage`;

    const { data } = await firstValueFrom(
      this.http.post<TelegramApiResponse>(url, {
        chat_id: targetChatId,
        text,
        parse_mode: 'HTML',
      }),
    );

    if (!data.ok) {
      throw new Error(data.description ?? 'Telegram API error');
    }

    this.logger.debug(`Message delivered to chat ${targetChatId}`);
  }
}
