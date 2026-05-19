export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

export interface IdempotencyStorePort {
  has(eventId: string): boolean;
  add(eventId: string): void;
}
