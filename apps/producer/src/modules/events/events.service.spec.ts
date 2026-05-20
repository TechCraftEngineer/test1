import type { RabbitMqService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const rabbitmq: jest.Mocked<Pick<RabbitMqService, 'publishEvent'>> = {
    publishEvent: jest.fn().mockResolvedValue(undefined),
  };
  const service = new EventsService(rabbitmq as unknown as RabbitMqService);

  it('publishes event to RabbitMQ', async () => {
    const event = await service.publish({
      type: 'order.created',
      payload: { orderId: 42 },
    });

    expect(rabbitmq.publishEvent).toHaveBeenCalledWith(event);
    expect(event.type).toBe('order.created');
    expect(event.id).toBeDefined();
    expect(event.createdAt).toBeDefined();
  });
});
