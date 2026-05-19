import type { NotificationMessage } from '@repo/shared';

export const NOTIFICATION_PUBLISHER = Symbol('NOTIFICATION_PUBLISHER');

export interface NotificationPublisherPort {
  publish(notification: NotificationMessage): Promise<void>;
}
