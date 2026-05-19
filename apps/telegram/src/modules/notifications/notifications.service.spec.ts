import { NotificationsService } from './notifications.service';
import type { TelegramService } from '../../infrastructure/telegram/telegram.service';

describe('NotificationsService', () => {
  const telegram: jest.Mocked<Pick<TelegramService, 'sendMessage'>> = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  };
  const service = new NotificationsService(telegram as unknown as TelegramService);

  it('delegates to telegram service', async () => {
    await service.send('Hello', '123');

    expect(telegram.sendMessage).toHaveBeenCalledWith('Hello', '123');
  });
});
