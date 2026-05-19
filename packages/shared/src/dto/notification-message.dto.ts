import type { EventMessage } from './event-message.dto';

export interface NotificationMessage {
  eventId: string;
  channel: 'telegram';
  text: string;
  sourceEvent: EventMessage;
}
