import { RABBITMQ } from '@repo/shared';
import type { Channel } from 'amqplib';

export async function assertEventsTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS, 'topic', {
    durable: true,
  });
  await channel.assertExchange(RABBITMQ.EXCHANGE_EVENTS_DLX, 'topic', {
    durable: true,
  });

  await channel.assertQueue(RABBITMQ.QUEUE_EVENTS_DLQ, { durable: true });
  await channel.bindQueue(
    RABBITMQ.QUEUE_EVENTS_DLQ,
    RABBITMQ.EXCHANGE_EVENTS_DLX,
    RABBITMQ.ROUTING_KEY_DLQ,
  );

  await channel.assertQueue(RABBITMQ.QUEUE_EVENTS_RETRY, {
    durable: true,
    arguments: {
      'x-message-ttl': 5000,
      'x-dead-letter-exchange': RABBITMQ.EXCHANGE_EVENTS,
      'x-dead-letter-routing-key': RABBITMQ.ROUTING_KEY_EVENT,
    },
  });
  await channel.bindQueue(
    RABBITMQ.QUEUE_EVENTS_RETRY,
    RABBITMQ.EXCHANGE_EVENTS_DLX,
    RABBITMQ.ROUTING_KEY_RETRY,
  );

  await channel.assertQueue(RABBITMQ.QUEUE_EVENTS, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RABBITMQ.EXCHANGE_EVENTS_DLX,
      'x-dead-letter-routing-key': RABBITMQ.ROUTING_KEY_RETRY,
    },
  });
  await channel.bindQueue(
    RABBITMQ.QUEUE_EVENTS,
    RABBITMQ.EXCHANGE_EVENTS,
    RABBITMQ.ROUTING_KEY_EVENT,
  );
}
