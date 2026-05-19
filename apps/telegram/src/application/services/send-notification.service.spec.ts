import type { NotificationMessage } from '@repo/shared';
import type { TelegramNotifierPort } from '../../domain/ports/telegram-notifier.port';
import { SendNotificationService } from './send-notification.service';

describe('SendNotificationService', () => {
  const telegram: jest.Mocked<TelegramNotifierPort> = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  };
  const service = new SendNotificationService(telegram);

  const notification: NotificationMessage = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    channel: 'telegram',
    text: 'Hello',
    sourceEvent: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test',
      payload: {},
      createdAt: new Date().toISOString(),
    },
  };

  it('delegates to telegram notifier', async () => {
    await service.execute(notification);
    expect(telegram.sendMessage).toHaveBeenCalledWith('Hello');
  });
});
