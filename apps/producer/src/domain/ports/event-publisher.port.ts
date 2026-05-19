import type { EventMessage } from '@repo/shared';

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface EventPublisherPort {
  publish(event: EventMessage): Promise<void>;
}
