export const RABBITMQ = {
  EXCHANGE_EVENTS: 'events.exchange',
  EXCHANGE_EVENTS_DLX: 'events.dlx',
  EXCHANGE_NOTIFICATIONS: 'notifications.exchange',
  EXCHANGE_NOTIFICATIONS_DLX: 'notifications.dlx',

  QUEUE_EVENTS: 'events.queue',
  QUEUE_EVENTS_RETRY: 'events.retry',
  QUEUE_EVENTS_DLQ: 'events.dlq',
  QUEUE_NOTIFICATIONS: 'notifications.queue',
  QUEUE_NOTIFICATIONS_DLQ: 'notifications.dlq',

  ROUTING_KEY_EVENT: 'event.created',
  ROUTING_KEY_NOTIFICATION: 'notification.send',
  ROUTING_KEY_RETRY: 'event.retry',
  ROUTING_KEY_DLQ: 'event.dead',
  ROUTING_KEY_NOTIFICATION_DLQ: 'notification.dead',
} as const;

export const RETRY_HEADER = 'x-retry-count';
export const RETRY_TTL_MS = 15000;
