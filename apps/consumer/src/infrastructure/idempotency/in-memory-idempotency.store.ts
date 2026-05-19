import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IdempotencyStorePort } from '../../domain/ports/idempotency-store.port';

/** Entries expire after this TTL (ms). */
const TTL_MS = 60 * 60 * 1000;

const EVICT_INTERVAL_MS = 60 * 1000;

/**
 * Ephemeral in-memory idempotency store (Map + TTL_MS).
 * All entries are lost on process restart and are not shared across instances,
 * so idempotency is not guaranteed under horizontal scaling.
 * Suitable for development and testing only; use Redis, Postgres, or another
 * persistent/clustered store in production via {@link IdempotencyStorePort}.
 */
@Injectable()
export class InMemoryIdempotencyStore
  implements IdempotencyStorePort, OnModuleInit, OnModuleDestroy
{
  private readonly store = new Map<string, number>();
  private evictTimer?: ReturnType<typeof setInterval>;

  onModuleInit(): void {
    this.evictTimer = setInterval(() => this.evictExpired(), EVICT_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.evictTimer !== undefined) {
      clearInterval(this.evictTimer);
      this.evictTimer = undefined;
    }
  }

  claim(eventId: string): boolean {
    if (this.store.has(eventId)) {
      return false;
    }
    this.store.set(eventId, Date.now() + TTL_MS);
    return true;
  }

  release(eventId: string): void {
    this.store.delete(eventId);
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
