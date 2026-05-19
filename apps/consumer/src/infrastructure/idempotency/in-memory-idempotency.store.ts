import { Injectable } from '@nestjs/common';
import type { IdempotencyStorePort } from '../../domain/ports/idempotency-store.port';

const TTL_MS = 60 * 60 * 1000;

@Injectable()
export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly store = new Map<string, number>();

  has(eventId: string): boolean {
    this.evictExpired();
    return this.store.has(eventId);
  }

  add(eventId: string): void {
    this.store.set(eventId, Date.now() + TTL_MS);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [id, expiresAt] of this.store) {
      if (expiresAt <= now) {
        this.store.delete(id);
      }
    }
  }
}
