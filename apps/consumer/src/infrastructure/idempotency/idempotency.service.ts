import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

const TTL_MS = 60 * 60 * 1000; // 1 час
const EVICT_INTERVAL_MS = 60 * 1000; // каждую минуту

/**
 * In-memory реализация идемпотентности.
 *
 * ⚠️ Ограничения:
 * - Состояние не переживает рестарт процесса.
 * - Не работает корректно при горизонтальном масштабировании (несколько инстансов).
 *
 * Для production с несколькими репликами замените на Redis-based реализацию
 * (например, через SET NX EX).
 */
@Injectable()
export class IdempotencyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly store = new Map<string, number>();
  private evictTimer?: ReturnType<typeof setInterval>;

  onModuleInit(): void {
    this.evictTimer = setInterval(() => this.evictExpired(), EVICT_INTERVAL_MS);
    this.logger.log('IdempotencyService started (in-memory store)');
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
