import type { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly defaultChatId: string;
  private readonly apiBaseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.botToken = config.getOrThrow<string>('telegram.botToken');
    this.defaultChatId = config.getOrThrow<string>('telegram.chatId');
    const base =
      config.get<string>('telegram.apiBaseUrl') ?? 'https://api.telegram.org';
    this.apiBaseUrl = base.trim().replace(/\/+$/, '');
  }

  async sendMessage(text: string, chatId?: string): Promise<void> {
    const targetChatId = chatId ?? this.defaultChatId;
    const url = `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`;

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
