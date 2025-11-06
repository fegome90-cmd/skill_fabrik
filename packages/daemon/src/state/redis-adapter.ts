// Minimal Redis-like interface to avoid hard dependency during sprint
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(key: string): Promise<any>;
}

export interface StateRecord<T> {
  value: T;
  ts: number;
}

export class RedisState<T> {
  constructor(private client: RedisLike, private namespace = 'sf:state') {}

  key(k: string) { return `${this.namespace}:${k}`; }

  async get(k: string): Promise<StateRecord<T> | null> {
    const raw = await this.client.get(this.key(k));
    return raw ? JSON.parse(raw) as StateRecord<T> : null;
  }

  async set(k: string, value: T, ttlSec?: number): Promise<void> {
    const payload = JSON.stringify({ value, ts: Date.now() } satisfies StateRecord<T>);
    if (ttlSec && ttlSec > 0) {
      await this.client.set(this.key(k), payload, 'EX', ttlSec);
    } else {
      await this.client.set(this.key(k), payload);
    }
  }

  async del(k: string): Promise<void> { await this.client.del(this.key(k)); }
}

export interface RedisFactory {
  create(): Promise<RedisLike>;
}
