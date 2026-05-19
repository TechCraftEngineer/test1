export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

export interface IdempotencyStorePort {
  /** Atomically reserves eventId; returns false if already claimed. */
  claim(eventId: string): boolean;
  /** Releases a claim so the event can be retried after a processing failure. */
  release(eventId: string): void;
}
