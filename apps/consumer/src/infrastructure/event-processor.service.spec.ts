import type { EventMessage } from '@repo/shared';
import { EventProcessorService } from './event-processor.service';
import type { IdempotencyService } from './idempotency/idempotency.service';
import type { RabbitMqService } from './rabbitmq/rabbitmq.service';

describe('EventProcessorService', () => {
  const idempotency: jest.Mocked<Pick<IdempotencyService, 'claim' | 'release'>> = {
    claim: jest.fn(),
    release: jest.fn(),
  };
  const rabbitmq: jest.Mocked<Pick<RabbitMqService, 'publishNotification'>> = {
    publishNotification: jest.fn().mockResolvedValue(undefined),
  };
  const service = new EventProcessorService(
    idempotency as unknown as IdempotencyService,
    rabbitmq as unknown as RabbitMqService,
  );

  const event: EventMessage = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'order.created',
    payload: { orderId: 1 },
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips duplicate events', async () => {
    idempotency.claim.mockReturnValue(false);

    await service.process(event);

    expect(rabbitmq.publishNotification).not.toHaveBeenCalled();
  });

  it('publishes notification for new events', async () => {
    idempotency.claim.mockReturnValue(true);

    await service.process(event);

    expect(rabbitmq.publishNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: event.id,
        channel: 'telegram',
        sourceEvent: event,
      }),
    );
  });

  it('releases idempotency claim on failure', async () => {
    idempotency.claim.mockReturnValue(true);

    await expect(
      service.process({ ...event, type: 'simulate.failure' }),
    ).rejects.toThrow('Simulated failure');

    expect(idempotency.release).toHaveBeenCalledWith(event.id);
  });
});
