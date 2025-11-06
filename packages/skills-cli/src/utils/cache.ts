import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createBox, colors, format, createSimpleBox } from './colors'
import { Spinner } from './progress'

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  hash: string;
}

export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  defaultTtl: number;
  storagePath?: string;
  compressionEnabled?: boolean;
  persistent?: boolean;
}

/**
 * Enhanced Async Cache System with Plan-Architect optimizations
 * Template v1.1.0 applied - Performance optimization for CLI
 */
export class Cache<K, V> {
  private cache = new Map<string, CacheEntry<V>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private cleanupTimer?: NodeJS.Timeout;
  private hits = 0;
  private misses = 0;
  private storagePath: string;

  constructor(private config: CacheConfig) {
    this.storagePath = config.storagePath || '.sf/cache';

    if (config.enabled) {
      const defaultTtl = config.defaultTtl || 3600000;
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, Math.min(defaultTtl / 4, 60000));

      // Initialize persistent cache if enabled
      if (config.persistent) {
        this.initPersistentCache();
      }
    }
  }

  private generateKey(key: K): string {
    try {
      const hash = createHash('md5')
        .update(JSON.stringify(key))
        .digest('hex')
      return `${hash.substring(0, 8)}`
    } catch {
      return String(key);
    }
  }

  private async initPersistentCache(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
    } catch (error) {
      console.warn(colors.warning(`Cache warning: Could not create storage directory: ${error}`))
    }
  }

  get(key: K): V | undefined {
    if (!this.config.enabled) return undefined;

    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access order (LRU)
    this.accessOrder.set(cacheKey, ++this.accessCounter);
    this.hits++;
    return entry.data;
  }

  /**
   * Async get with persistent storage support
   */
  async getAsync(key: K): Promise<V | undefined> {
    if (!this.config.enabled) return undefined;

    // Try memory cache first
    const memResult = this.get(key);
    if (memResult !== undefined) {
      return memResult;
    }

    // Try persistent cache if enabled
    if (this.config.persistent) {
      try {
        const cacheKey = this.generateKey(key);
        const filePath = join(this.storagePath, `${cacheKey}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry<V> = JSON.parse(data);

        if (Date.now() - entry.timestamp <= entry.ttl) {
          // Restore to memory cache
          this.cache.set(cacheKey, entry);
          this.accessOrder.set(cacheKey, ++this.accessCounter);
          this.hits++;
          return entry.data;
        } else {
          // Remove expired file
          await fs.unlink(filePath);
        }
      } catch {
        // File doesn't exist or is corrupted
      }
    }

    this.misses++;
    return undefined;
  }

  /**
   * Get or set with async factory function - Plan-Architect optimization
   */
  async getOrSet(
    key: K,
    factory: () => Promise<V>,
    ttl?: number
  ): Promise<V> {
    const cached = await this.getAsync(key);
    if (cached !== undefined) {
      return cached;
    }

    const spinner = new Spinner('Computing result...');
    spinner.start();

    try {
      const data = await factory();
      await this.setAsync(key, data, ttl);
      spinner.stop('Result cached successfully');
      return data;
    } catch (error) {
      spinner.stop('Failed to compute result');
      throw error;
    }
  }

  set(key: K, value: V, ttl?: number): void {
    if (!this.config.enabled) return;

    const cacheKey = this.generateKey(key);
    const actualTtl = ttl || this.config.defaultTtl || 3600000;

    // Prevent caching very large values
    try {
      const serializedSize = JSON.stringify(value).length;
      if (serializedSize > 1024 * 1024) {
        return;
      }
    } catch {
      return;
    }

    // Apply LRU policy if size exceeds max
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<V> = {
      data: value,
      timestamp: Date.now(),
      ttl: actualTtl,
      key: cacheKey,
      hash: createHash('md5').update(JSON.stringify(value)).digest('hex')
    };

    this.cache.set(cacheKey, entry);
    this.accessOrder.set(cacheKey, ++this.accessCounter);
  }

  /**
   * Async set with persistent storage support
   */
  async setAsync(key: K, value: V, ttl?: number): Promise<void> {
    if (!this.config.enabled) return;

    const cacheKey = this.generateKey(key);
    const actualTtl = ttl || this.config.defaultTtl || 3600000;

    // Set in memory cache
    this.set(key, value, ttl);

    // Persist to disk if enabled
    if (this.config.persistent) {
      try {
        await fs.mkdir(this.storagePath, { recursive: true });
        const filePath = join(this.storagePath, `${cacheKey}.json`);
        const entry = this.cache.get(cacheKey);

        if (entry) {
          await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
        }
      } catch (error) {
        console.warn(colors.warning(`Cache warning: Could not persist entry: ${error}`));
      }
    }
  }

  delete(key: K): boolean {
    const cacheKey = this.generateKey(key);
    this.accessOrder.delete(cacheKey);
    return this.cache.delete(cacheKey);
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    hits: number;
    misses: number;
    memoryUsage: NodeJS.MemoryUsage;
    storagePath: string;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.hits,
      misses: this.misses,
      memoryUsage: process.memoryUsage(),
      storagePath: this.storagePath
    };
  }

  /**
   * Display cache dashboard with professional formatting
   */
  showDashboard(): void {
    const stats = this.getStats();

    console.log(
      createBox(
        format.header('🗄️  Cache Dashboard') + '\n\n' +

        format.section('Cache Statistics') +
        format.bullet('Size', `${colors.info(`${stats.size}/${stats.maxSize}`)} entries`) +
        format.bullet('Hit Rate', colors.success(`${stats.hitRate}%`)) +
        format.bullet('Total Requests', colors.text(`${stats.hits + stats.misses}`)) +
        format.bullet('Memory Usage', colors.text(`${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)}MB`)) + '\n' +

        format.section('Performance Impact') +
        format.bullet('Default TTL', colors.text(`${this.config.defaultTtl / 1000}s`)) +
        format.bullet('Storage Path', format.command(stats.storagePath)) +
        format.bullet('Persistent Cache', this.config.persistent ?
          colors.success('Enabled') : colors.warning('Disabled')) +
        format.bullet('Compression', this.config.compressionEnabled ?
          colors.success('Enabled') : colors.warning('Disabled')) + '\n' +

        format.section('Quick Actions') +
        format.command('cache.clear - Clear all cache entries') + '\n' +
        format.command('cache.stats - Show detailed statistics') + '\n' +
        format.command('cache.cleanup - Run cleanup manually') + '\n',
        undefined,
        colors.info
      )
    );
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

// Singleton instance for CLI operations
export const cliCache = new Cache<string, any>({
  enabled: true,
  maxSize: 500,
  defaultTtl: 10 * 60 * 1000, // 10 minutes for CLI
  storagePath: '.sf/cli-cache',
  compressionEnabled: true,
  persistent: true
});

/**
 * Cache decorator for async functions - Plan-Architect optimization
 */
export function cached<T extends any[], R>(
  keyPrefix: string,
  ttl: number = 10 * 60 * 1000
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      return cliCache.getOrSet(cacheKey, () => method.apply(this, args), ttl);
    }

    return descriptor
  }
}

/**
 * Memoization utility for expensive computations with Plan-Architect optimizations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 10 * 60 * 1000
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const now = Date.now()

    const cached = cache.get(key)
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value
    }

    const result = fn(...args)
    cache.set(key, { value: result, timestamp: now })

    // Cleanup old entries
    if (cache.size > 100) {
      const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)

      for (const [k] of entries.slice(0, 50)) {
        cache.delete(k)
      }
    }

    return result
  }) as T
}
