export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // time to live in ms
  accessCount: number;
  lastAccessed: number;
  size: number; // bytes
  source: 'L1' | 'L2' | 'computed';
}

export interface CacheConfig {
  L1: {
    maxSize: number; // MB
    maxEntries: number;
    ttl: number; // ms
    evictionPolicy: 'lru' | 'lfu' | 'ttl';
  };
  L2: {
    enabled: boolean;
    redis: {
      host: string;
      port: number;
      password?: string;
      database?: number;
      keyPrefix: string;
      ttl: number; // ms
    };
    compression: boolean;
    serialization: 'json' | 'binary';
  };
  warming: {
    enabled: boolean;
    strategies: ('precomputed' | 'predictive' | 'periodic')[];
    warmupConcurrency: number;
    refreshInterval: number; // ms
  };
  invalidation: {
    strategies: ('ttl' | 'manual' | 'dependency' | 'event')[];
    eventDriven: boolean;
    dependencyTracking: boolean;
  };
  metrics: {
    enabled: boolean;
    exportInterval: number; // ms
    detailed: boolean;
  };
}

export interface CacheMetrics {
  hits: {
    L1: number;
    L2: number;
    total: number;
  };
  misses: {
    L1: number;
    L2: number;
    total: number;
  };
  sets: {
    L1: number;
    L2: number;
    total: number;
  };
  evictions: {
    L1: number;
    L2: number;
    total: number;
  };
  operations: {
    get: number;
    set: number;
    delete: number;
    clear: number;
  };
  performance: {
    avgGetTime: number; // ms
    avgSetTime: number; // ms
    totalSavings: number; // ms saved by cache hits
  };
  size: {
    L1: {
      entries: number;
      bytes: number;
    };
    L2: {
      entries: number;
      bytes: number;
    };
  };
  hitRate: number; // overall hit rate 0..1
  timestamp: number;
}

export interface CacheKey {
  signalName: string;
  skillName: string;
  prompt: string;
  contextHash: string;
  version: string;
}

export class SignalCache<T = any> {
  private readonly config: CacheConfig;
  private L1Cache: Map<string, CacheEntry<T>> = new Map();
  private L2Cache?: any; // Redis client
  private metrics: CacheMetrics;
  private metricsTimer?: NodeJS.Timeout;
  private warmingTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = this.mergeConfig(config);
    this.metrics = this.initializeMetrics();

    if (this.config.L2.enabled) {
      this.initializeL2Cache();
    }

    if (this.config.metrics.enabled) {
      this.startMetricsCollection();
    }

    if (this.config.warming.enabled) {
      this.startCacheWarming();
    }
  }

  // Main cache operations
  async get(key: CacheKey): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.serializeKey(key);
    this.metrics.operations.get++;

    // Try L1 cache first
    const l1Result = this.getFromL1(cacheKey);
    if (l1Result !== null) {
      this.metrics.hits.L1++;
      this.metrics.hits.total++;
      this.metrics.performance.totalSavings += Date.now() - startTime;
      return l1Result;
    }
    this.metrics.misses.L1++;

    // Try L2 cache if enabled
    if (this.config.L2.enabled) {
      const l2Result = await this.getFromL2(cacheKey);
      if (l2Result !== null) {
        // Promote to L1
        this.setToL1(cacheKey, l2Result);
        this.metrics.hits.L2++;
        this.metrics.hits.total++;
        this.metrics.performance.totalSavings += Date.now() - startTime;
        return l2Result;
      }
      this.metrics.misses.L2++;
    }

    this.metrics.misses.total++;
    return null;
  }

  async set(key: CacheKey, value: T, options?: { ttl?: number; source?: 'computed' }): Promise<void> {
    const startTime = Date.now();
    const cacheKey = this.serializeKey(key);
    this.metrics.operations.set++;

    const ttl = options?.ttl || this.config.L1.ttl;
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(value),
      source: options?.source || 'computed'
    };

    // Set in L1
    this.setToL1(cacheKey, entry);
    this.metrics.sets.L1++;

    // Set in L2 if enabled
    if (this.config.L2.enabled) {
      await this.setToL2(cacheKey, entry);
      this.metrics.sets.L2++;
    }

    this.metrics.sets.total++;
    this.metrics.performance.avgSetTime =
      (this.metrics.performance.avgSetTime + (Date.now() - startTime)) / 2;
  }

  async delete(key: CacheKey): Promise<boolean> {
    const cacheKey = this.serializeKey(key);
    this.metrics.operations.delete++;

    let deleted = false;

    // Delete from L1
    if (this.L1Cache.delete(cacheKey)) {
      deleted = true;
    }

    // Delete from L2 if enabled
    if (this.config.L2.enabled && this.L2Cache) {
      try {
        await this.L2Cache.del(cacheKey);
        deleted = true;
      } catch (error) {
        console.warn('L2 cache delete failed:', error);
      }
    }

    return deleted;
  }

  async clear(pattern?: string): Promise<void> {
    this.metrics.operations.clear++;

    if (pattern) {
      // Clear matching entries
      const regex = new RegExp(pattern);
      for (const [key] of this.L1Cache.entries()) {
        if (regex.test(key)) {
          this.L1Cache.delete(key);
        }
      }

      if (this.config.L2.enabled && this.L2Cache) {
        try {
          const keys = await this.L2Cache.keys(`${this.config.L2.redis.keyPrefix}*${pattern}*`);
          if (keys.length > 0) {
            await this.L2Cache.del(...keys);
          }
        } catch (error) {
          console.warn('L2 cache clear with pattern failed:', error);
        }
      }
    } else {
      // Clear all
      this.L1Cache.clear();

      if (this.config.L2.enabled && this.L2Cache) {
        try {
          const keys = await this.L2Cache.keys(`${this.config.L2.redis.keyPrefix}*`);
          if (keys.length > 0) {
            await this.L2Cache.del(...keys);
          }
        } catch (error) {
          console.warn('L2 cache clear failed:', error);
        }
      }
    }
  }

  // L1 cache operations
  private getFromL1(key: string): T | null {
    const entry = this.L1Cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.L1Cache.delete(key);
      this.metrics.evictions.L1++;
      return null;
    }

    // Update access metrics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  private setToL1(key: string, entry: CacheEntry<T>): void {
    // Check if we need to evict entries
    this.evictFromL1();

    // Set the entry
    this.L1Cache.set(key, entry);
    this.metrics.size.L1.entries = this.L1Cache.size;
    this.metrics.size.L1.bytes = this.calculateL1Size();
  }

  private evictFromL1(): void {
    const maxEntries = this.config.L1.maxEntries;
    const maxSizeBytes = this.config.L1.maxSize * 1024 * 1024; // Convert MB to bytes

    if (this.L1Cache.size <= maxEntries && this.calculateL1Size() <= maxSizeBytes) {
      return;
    }

    const entries = Array.from(this.L1Cache.entries());

    // Sort by eviction policy
    switch (this.config.L1.evictionPolicy) {
      case 'lru':
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'ttl':
        entries.sort((a, b) => (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl));
        break;
    }

    // Evict entries until we're under limits
    let evicted = 0;
    for (const [key] of entries) {
      this.L1Cache.delete(key);
      this.metrics.evictions.L1++;
      evicted++;

      if (this.L1Cache.size <= maxEntries && this.calculateL1Size() <= maxSizeBytes) {
        break;
      }
    }
  }

  private calculateL1Size(): number {
    return Array.from(this.L1Cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  // L2 cache operations (Redis)
  private async initializeL2Cache(): Promise<void> {
    try {
      // Import Redis dynamically to avoid dependency issues
      const { default: Redis } = await import('ioredis');

      this.L2Cache = new Redis({
        host: this.config.L2.redis.host,
        port: this.config.L2.redis.port,
        password: this.config.L2.redis.password,
        db: this.config.L2.redis.database || 0,
        keyPrefix: this.config.L2.redis.keyPrefix,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.L2Cache.on('error', (error: Error) => {
        console.warn('Redis cache error:', error);
      });

      await this.L2Cache.connect();
      console.log('✅ L2 cache (Redis) connected');
    } catch (error) {
      console.warn('Failed to initialize L2 cache:', error);
      this.config.L2.enabled = false;
    }
  }

  private async getFromL2(key: string): Promise<T | null> {
    if (!this.L2Cache) return null;

    try {
      const data = await this.L2Cache.get(key);
      if (!data) return null;

      let entry: CacheEntry<T>;

      if (this.config.L2.serialization === 'json') {
        entry = JSON.parse(data);
      } else {
        // Binary deserialization
        entry = this.deserializeBinary(data);
      }

      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.L2Cache.del(key);
        this.metrics.evictions.L2++;
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn('L2 cache get failed:', error);
      return null;
    }
  }

  private async setToL2(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.L2Cache) return;

    try {
      let data: string;

      if (this.config.L2.serialization === 'json') {
        data = JSON.stringify(entry);
      } else {
        data = this.serializeBinary(entry);
      }

      await this.L2Cache.setex(key, Math.ceil(entry.ttl / 1000), data);
    } catch (error) {
      console.warn('L2 cache set failed:', error);
    }
  }

  // Cache warming strategies
  private startCacheWarming(): void {
    if (!this.config.warming.enabled) return;

    this.warmingTimer = setInterval(async () => {
      await this.performCacheWarming();
    }, this.config.warming.refreshInterval);
  }

  private async performCacheWarming(): Promise<void> {
    // This would be implemented with actual signal evaluation data
    // For now, it's a placeholder for the warming logic
    console.log('🔥 Cache warming performed');
  }

  // Metrics collection
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.metrics.exportInterval);
  }

  private updateMetrics(): void {
    this.metrics.hitRate = this.metrics.hits.total / (this.metrics.hits.total + this.metrics.misses.total) || 0;
    this.metrics.size.L1.entries = this.L1Cache.size;
    this.metrics.size.L1.bytes = this.calculateL1Size();
    this.metrics.timestamp = Date.now();
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hits: { L1: 0, L2: 0, total: 0 },
      misses: { L1: 0, L2: 0, total: 0 },
      sets: { L1: 0, L2: 0, total: 0 },
      evictions: { L1: 0, L2: 0, total: 0 },
      operations: { get: 0, set: 0, delete: 0, clear: 0 },
      performance: { avgGetTime: 0, avgSetTime: 0, totalSavings: 0 },
      size: { L1: { entries: 0, bytes: 0 }, L2: { entries: 0, bytes: 0 } },
      hitRate: 0,
      timestamp: Date.now()
    };
  }

  // Utility methods
  private serializeKey(key: CacheKey): string {
    const parts = [
      key.signalName,
      key.skillName,
      key.contextHash,
      key.version || 'v1'
    ];
    return parts.join(':');
  }

  private calculateSize(value: any): number {
    // Rough estimate of serialized size
    return JSON.stringify(value).length * 2; // 2 bytes per char (UTF-16)
  }

  private serializeBinary(entry: CacheEntry<any>): string {
    // Placeholder for binary serialization
    // In a real implementation, this would use something like MessagePack or Protocol Buffers
    return JSON.stringify(entry);
  }

  private deserializeBinary(data: string): CacheEntry<any> {
    // Placeholder for binary deserialization
    return JSON.parse(data);
  }

  private mergeConfig(userConfig?: Partial<CacheConfig>): CacheConfig {
    const defaultConfig: CacheConfig = {
      L1: {
        maxSize: 100, // 100MB
        maxEntries: 10000,
        ttl: 3600000, // 1 hour
        evictionPolicy: 'lru'
      },
      L2: {
        enabled: false,
        redis: {
          host: 'localhost',
          port: 6379,
          keyPrefix: 'signal_cache:',
          ttl: 7200000 // 2 hours
        },
        compression: true,
        serialization: 'json'
      },
      warming: {
        enabled: true,
        strategies: ['predictive'],
        warmupConcurrency: 5,
        refreshInterval: 300000 // 5 minutes
      },
      invalidation: {
        strategies: ['ttl', 'manual'],
        eventDriven: false,
        dependencyTracking: false
      },
      metrics: {
        enabled: true,
        exportInterval: 60000, // 1 minute
        detailed: true
      }
    };

    return this.deepMerge(defaultConfig, userConfig || {});
  }

  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }

    return result;
  }

  // Public API methods
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async getHealth(): Promise<{
    L1: { status: 'healthy' | 'degraded' | 'unhealthy'; size: number; hitRate: number };
    L2: { status: 'healthy' | 'degraded' | 'unhealthy'; connected: boolean; size: number };
    overall: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const l1Health = this.metrics.hitRate > 0.7 ? 'healthy' :
                     this.metrics.hitRate > 0.4 ? 'degraded' : 'unhealthy';

    let l2Health: { status: 'healthy' | 'degraded' | 'unhealthy'; connected: boolean; size: number } = {
      status: 'healthy',
      connected: false,
      size: 0
    };

    if (this.config.L2.enabled && this.L2Cache) {
      try {
        await this.L2Cache.ping();
        l2Health.connected = true;
        l2Health.status = 'healthy';
        l2Health.size = this.metrics.size.L2.entries;
      } catch (error) {
        l2Health.status = 'unhealthy';
      }
    }

    const overall = (l1Health === 'healthy' && (!this.config.L2.enabled || l2Health.connected)) ?
                    'healthy' : 'degraded';

    return {
      L1: {
        status: l1Health,
        size: this.metrics.size.L1.entries,
        hitRate: this.metrics.hitRate
      },
      L2: l2Health,
      overall
    };
  }

  // Cleanup
  stop(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
      this.warmingTimer = undefined;
    }

    if (this.L2Cache) {
      this.L2Cache.disconnect();
      this.L2Cache = undefined;
    }

    this.L1Cache.clear();
  }

  // Advanced features
  async preloadData(keys: CacheKey[], values: T[]): Promise<void> {
    if (keys.length !== values.length) {
      throw new Error('Keys and values arrays must have the same length');
    }

    const promises = keys.map((key, index) =>
      this.set(key, values[index], { source: 'L1' })
    );

    await Promise.all(promises);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    // Invalidate from L1
    for (const [key] of this.L1Cache.entries()) {
      if (regex.test(key)) {
        this.L1Cache.delete(key);
        invalidated++;
      }
    }

    // Invalidate from L2
    if (this.config.L2.enabled && this.L2Cache) {
      try {
        const keys = await this.L2Cache.keys(`${this.config.L2.redis.keyPrefix}*${pattern}*`);
        if (keys.length > 0) {
          await this.L2Cache.del(...keys);
          invalidated += keys.length;
        }
      } catch (error) {
        console.warn('L2 pattern invalidation failed:', error);
      }
    }

    return invalidated;
  }
}