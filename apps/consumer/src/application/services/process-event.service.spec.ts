import type { EventMessage } from '@repo/shared';
import type { IdempotencyStorePort } from '../../domain/ports/idempotency-store.port';
import type { NotificationPublisherPort } from '../../domain/ports/notification-publisher.port';
import { ProcessEventService } from './process-event.service';

describe('ProcessEventService', () => {
  const idempotency: jest.Mocked<IdempotencyStorePort> = {
    has: jest.fn(),
    add: jest.fn(),
  };
  const publisher: jest.Mocked<NotificationPublisherPort> = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProcessEventService(idempotency, publisher);

  const event: EventMessage = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'order.created',
    payload: { orderId: 1 },
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('skips duplicate events', async () => {
    idempotency.has.mockReturnValue(true);
    await service.execute(event);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('publishes notification for new events', async () => {
    idempotency.has.mockReturnValue(false);
    await service.execute(event);
    expect(publisher.publish).toHaveBeenCalled();
    expect(idempotency.add).toHaveBeenCalledWith(event.id);
  });

  it('throws on simulate.failure type', async () => {
    idempotency.has.mockReturnValue(false);
    await expect(
      service.execute({ ...event, type: 'simulate.failure' }),
    ).rejects.toThrow('Simulated failure');
  });
});
