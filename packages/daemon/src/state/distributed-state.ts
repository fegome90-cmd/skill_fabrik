import { RedisState, type RedisLike } from './redis-adapter.js';
import { createRequire } from 'node:module';

export interface KVState<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryState<T> implements KVState<T> {
  private map = new Map<string, { value: T; exp?: number }>();
  constructor(private defaultTtlSec?: number) {}

  async get(key: string): Promise<T | null> {
    const rec = this.map.get(key);
    if (!rec) return null;
    if (rec.exp && Date.now() > rec.exp) {
      this.map.delete(key);
      return null;
    }
    return rec.value;
  }

  async set(key: string, value: T, ttlSec?: number): Promise<void> {
    const ttl = (ttlSec ?? this.defaultTtlSec) || 0;
    const exp = ttl > 0 ? Date.now() + ttl * 1000 : undefined;
    this.map.set(key, { value, exp });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

export async function createDistributedState<T>(namespace: string, opts?: { ttlSec?: number }): Promise<KVState<T>> {
  if (process.env.SF_STATE_REDIS === '1') {
    try {
      const require = createRequire(import.meta.url);
      const Redis = require('ioredis');
      const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      const client: RedisLike = new Redis(url);
      const rs = new RedisState<T>(client, namespace);
      // Adapter to KVState that returns value only
      return {
        async get(key: string) {
          const rec = await rs.get(key);
          return rec ? rec.value : null;
        },
        async set(key: string, value: T, ttlSec?: number) {
          await rs.set(key, value, ttlSec ?? opts?.ttlSec);
        },
        async del(key: string) { await rs.del(key); },
      } satisfies KVState<T>;
    } catch {
      // fallthrough to memory
    }
  }
  return new MemoryState<T>(opts?.ttlSec);
}

