export const TELEGRAM_NOTIFIER = Symbol('TELEGRAM_NOTIFIER');

export interface TelegramNotifierPort {
  sendMessage(text: string, chatId?: string): Promise<void>;
}
