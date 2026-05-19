import type { EventMessage } from '@repo/shared';
import type { IdempotencyStorePort } from '../../domain/ports/idempotency-store.port';
import type { NotificationPublisherPort } from '../../domain/ports/notification-publisher.port';
import { ProcessEventService } from './process-event.service';

describe('ProcessEventService', () => {
  const idempotency: jest.Mocked<IdempotencyStorePort> = {
    claim: jest.fn(),
    release: jest.fn(),
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
    idempotency.claim.mockReturnValue(false);
    await service.execute(event);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('publishes notification for new events', async () => {
    idempotency.claim.mockReturnValue(true);
    await service.execute(event);
    expect(publisher.publish).toHaveBeenCalled();
    expect(idempotency.release).not.toHaveBeenCalled();
  });

  it('releases claim on simulate.failure', async () => {
    idempotency.claim.mockReturnValue(true);
    await expect(
      service.execute({ ...event, type: 'simulate.failure' }),
    ).rejects.toThrow('Simulated failure');
    expect(idempotency.release).toHaveBeenCalledWith(event.id);
  });
});
