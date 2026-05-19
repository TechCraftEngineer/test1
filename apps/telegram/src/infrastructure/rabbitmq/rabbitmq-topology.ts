import { RABBITMQ } from '@repo/shared';
import type { Channel } from 'amqplib';

export async function assertTelegramTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(RABBITMQ.EXCHANGE_NOTIFICATIONS, 'topic', {
    durable: true,
  });
  await channel.assertQueue(RABBITMQ.QUEUE_NOTIFICATIONS, { durable: true });
  await channel.bindQueue(
    RABBITMQ.QUEUE_NOTIFICATIONS,
    RABBITMQ.EXCHANGE_NOTIFICATIONS,
    RABBITMQ.ROUTING_KEY_NOTIFICATION,
  );
}
