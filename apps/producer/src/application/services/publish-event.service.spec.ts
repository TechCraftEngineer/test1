import type { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { PublishEventService } from './publish-event.service';

describe('PublishEventService', () => {
  const publisher: jest.Mocked<EventPublisherPort> = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const service = new PublishEventService(publisher);

  beforeEach(() => jest.clearAllMocks());

  it('assigns UUID when id is omitted', async () => {
    const result = await service.execute({
      type: 'test.event',
      payload: { foo: 'bar' },
    });

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(publisher.publish).toHaveBeenCalledWith(result);
  });

  it('preserves provided id for idempotency', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const result = await service.execute({
      id,
      type: 'test.event',
      payload: {},
    });

    expect(result.id).toBe(id);
  });
});
