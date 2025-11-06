import { type SignalCache, type CacheConfig } from '../cache/SignalCache.js';

export interface RedisL2AdapterConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix: string;
    maxRetries: number;
    retryDelayOnFailover: number;
    lazyConnect: boolean;
    connectionTimeout: number;
    commandTimeout: number;
  };
  clustering?: {
    enabled: boolean;
    nodes: Array<{ host: string; port: number }>;
    options: {
      redisOptions: any;
      maxRedirections: number;
      retryDelayOnFailover: number;
    };
  };
  healthCheck: {
    enabled: boolean;
    interval: number; // ms
    timeout: number; // ms
    maxFailures: number;
  };
  performance: {
    pipelining: boolean;
    batchSize: number;
    compression: boolean;
    compressionThreshold: number; // bytes
    serialization: 'json' | 'binary' | 'msgpack';
  };
  monitoring: {
    enabled: boolean;
    slowLogThreshold: number; // ms
    metricsInterval: number; // ms
    detailed: boolean;
  };
}

export interface RedisHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected: boolean;
  latency: number; // ms
  memory: {
    used: number;
    max: number;
    percentage: number;
  };
  connections: {
    active: number;
    total: number;
  };
  lastCheck: number;
  failures: number;
}

export interface RedisMetrics {
  operations: {
    get: { count: number; totalTime: number; errors: number };
    set: { count: number; totalTime: number; errors: number };
    del: { count: number; totalTime: number; errors: number };
    keys: { count: number; totalTime: number; errors: number };
  };
  performance: {
    avgGetTime: number;
    avgSetTime: number;
    hitRate: number;
    errorRate: number;
    throughput: number; // ops/sec
  };
  memory: {
    cacheSize: number;
    evictions: number;
    keyspaceHits: number;
    keyspaceMisses: number;
  };
  timestamp: number;
}

export class RedisL2Adapter {
  private config: RedisL2AdapterConfig;
  private client?: any; // Redis client
  private metrics: RedisMetrics;
  private healthStatus: RedisHealthStatus;
  private healthCheckTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config?: Partial<RedisL2AdapterConfig>) {
    this.config = this.mergeConfig(config);
    this.metrics = this.initializeMetrics();
    this.healthStatus = this.initializeHealthStatus();
  }

  async initialize(): Promise<void> {
    try {
      if (this.config.clustering?.enabled) {
        await this.initializeCluster();
      } else {
        await this.initializeSingle();
      }

      await this.setupEventHandlers();

      if (this.config.healthCheck.enabled) {
        this.startHealthCheck();
      }

      if (this.config.monitoring.enabled) {
        this.startMetricsCollection();
      }

      console.log('✅ Redis L2 adapter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Redis L2 adapter:', error);
      throw error;
    }
  }

  private async initializeSingle(): Promise<void> {
    const { default: Redis } = await import('ioredis');

    this.client = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.database || 0,
      keyPrefix: this.config.redis.keyPrefix,
      maxRetriesPerRequest: this.config.redis.maxRetries,
      retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
      lazyConnect: this.config.redis.lazyConnect,
      connectTimeout: this.config.redis.connectionTimeout,
      commandTimeout: this.config.redis.commandTimeout,
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
      // Performance optimizations
      enableOfflineQueue: false,
      lazyConnect: true,
      // Pipeline support
      enableAutoPipelining: this.config.performance.pipelining,
      autoPipeliningIgnoredCommands: ['subscribe', 'unsubscribe', 'psubscribe', 'punsubscribe']
    });

    await this.client.connect();
  }

  private async initializeCluster(): Promise<void> {
    if (!this.config.clustering) {
      throw new Error('Clustering configuration is required for cluster mode');
    }

    const { default: Cluster } = await import('ioredis');

    this.client = new Cluster(this.config.clustering.nodes, {
      redisOptions: {
        password: this.config.redis.password,
        connectTimeout: this.config.redis.connectionTimeout,
        commandTimeout: this.config.redis.commandTimeout,
        maxRetriesPerRequest: this.config.redis.maxRetries,
        retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
        lazyConnect: this.config.redis.lazyConnect,
        keyPrefix: this.config.redis.keyPrefix,
        enableAutoPipelining: this.config.performance.pipelining,
        autoPipeliningIgnoredCommands: ['subscribe', 'unsubscribe', 'psubscribe', 'punsubscribe']
      },
      maxRedirections: this.config.clustering.options.maxRedirections,
      retryDelayOnFailover: this.config.clustering.options.retryDelayOnFailover,
      enableReadyCheck: true,
      slotsRefreshTimeout: 5000
    });

    await this.client.connect();
  }

  private async setupEventHandlers(): Promise<void> {
    if (!this.client) return;

    // Connection events
    this.client.on('connect', () => {
      console.log('🔗 Redis L2 connected');
      this.healthStatus.connected = true;
      this.healthStatus.failures = 0;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis L2 ready');
    });

    this.client.on('error', (error: Error) => {
      console.error('❌ Redis L2 error:', error);
      this.healthStatus.connected = false;
      this.healthStatus.failures++;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis L2 connection closed');
      this.healthStatus.connected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis L2 reconnecting...');
    });

    // Performance monitoring
    if (this.config.monitoring.enabled) {
      this.client.on('command', (command: string, args: any[]) => {
        const startTime = Date.now();

        // Track slow commands
        this.client.on(`commandComplete_${command}`, () => {
          const duration = Date.now() - startTime;
          if (duration > this.config.monitoring.slowLogThreshold) {
            console.warn(`🐌 Slow Redis command: ${command} (${duration}ms)`, args);
          }
        });
      });
    }
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.healthStatus.connected) {
      this.metrics.operations.get.errors++;
      return null;
    }

    const startTime = Date.now();
    try {
      const result = await this.client.get(key);
      const duration = Date.now() - startTime;

      this.updateOperationMetrics('get', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('get', duration, false);
      console.warn('Redis L2 get failed:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client || !this.healthStatus.connected) {
      this.metrics.operations.set.errors++;
      throw new Error('Redis L2 not connected');
    }

    const startTime = Date.now();
    try {
      if (ttl) {
        await this.client.setex(key, Math.ceil(ttl / 1000), value);
      } else {
        await this.client.set(key, value);
      }
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('set', duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('set', duration, false);
      console.warn('Redis L2 set failed:', error);
      throw error;
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.client || !this.healthStatus.connected) {
      this.metrics.operations.del.errors++;
      return 0;
    }

    const startTime = Date.now();
    try {
      const result = await this.client.del(...keys);
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('del', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('del', duration, false);
      console.warn('Redis L2 del failed:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.healthStatus.connected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Redis L2 exists failed:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.healthStatus.connected) {
      return [];
    }

    const startTime = Date.now();
    try {
      const result = await this.client.keys(pattern);
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('keys', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateOperationMetrics('keys', duration, false);
      console.warn('Redis L2 keys failed:', error);
      return [];
    }
  }

  async ping(): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      return await this.client.ping();
    } catch (error) {
      console.warn('Redis L2 ping failed:', error);
      throw error;
    }
  }

  async info(section?: string): Promise<string> {
    if (!this.client || !this.healthStatus.connected) {
      throw new Error('Redis L2 not connected');
    }

    try {
      return await this.client.info(section);
    } catch (error) {
      console.warn('Redis L2 info failed:', error);
      throw error;
    }
  }

  // Batch operations
  async mget(...keys: string[]): Promise<(string | null)[]> {
    if (!this.client || !this.healthStatus.connected) {
      return keys.map(() => null);
    }

    try {
      return await this.client.mget(...keys);
    } catch (error) {
      console.warn('Redis L2 mget failed:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValues: Record<string, string>): Promise<void> {
    if (!this.client || !this.healthStatus.connected) {
      throw new Error('Redis L2 not connected');
    }

    try {
      await this.client.mset(keyValues);
    } catch (error) {
      console.warn('Redis L2 mset failed:', error);
      throw error;
    }
  }

  // Pipeline operations
  createPipeline(): any {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client.pipeline();
  }

  // Health checking
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheck.interval);
  }

  private async performHealthCheck(): Promise<void> {
    if (this.isShuttingDown) return;

    const startTime = Date.now();
    let latency = 0;
    let connected = false;

    try {
      await this.ping();
      latency = Date.now() - startTime;
      connected = true;
      this.healthStatus.failures = 0;
    } catch (error) {
      console.warn('Redis L2 health check failed:', error);
      connected = false;
      this.healthStatus.failures++;
    }

    // Update memory info
    try {
      const info = await this.info('memory');
      const memoryInfo = this.parseMemoryInfo(info);
      this.healthStatus.memory = memoryInfo;
    } catch (error) {
      // Ignore memory info errors
    }

    // Update connection info
    try {
      const info = await this.info('clients');
      const clientInfo = this.parseClientInfo(info);
      this.healthStatus.connections = clientInfo;
    } catch (error) {
      // Ignore client info errors
    }

    this.healthStatus.connected = connected;
    this.healthStatus.latency = latency;
    this.healthStatus.lastCheck = Date.now();

    // Determine overall health
    if (!connected || this.healthStatus.failures >= this.config.healthCheck.maxFailures) {
      this.healthStatus.status = 'unhealthy';
    } else if (latency > 100 || this.healthStatus.memory.percentage > 90) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'healthy';
    }
  }

  private parseMemoryInfo(info: string): RedisHealthStatus['memory'] {
    const lines = info.split('\r\n');
    const memory: RedisHealthStatus['memory'] = {
      used: 0,
      max: 0,
      percentage: 0
    };

    for (const line of lines) {
      if (line.startsWith('used_memory:')) {
        memory.used = parseInt(line.split(':')[1]);
      } else if (line.startsWith('maxmemory:')) {
        memory.max = parseInt(line.split(':')[1]);
      }
    }

    if (memory.max > 0) {
      memory.percentage = (memory.used / memory.max) * 100;
    }

    return memory;
  }

  private parseClientInfo(info: string): RedisHealthStatus['connections'] {
    const lines = info.split('\r\n');
    const connections: RedisHealthStatus['connections'] = {
      active: 0,
      total: 0
    };

    for (const line of lines) {
      if (line.startsWith('connected_clients:')) {
        connections.active = parseInt(line.split(':')[1]);
      }
    }

    connections.total = connections.active; // Simplified
    return connections;
  }

  // Metrics collection
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.monitoring.metricsInterval);
  }

  private updateMetrics(): void {
    // Calculate performance metrics
    const getOps = this.metrics.operations.get.count;
    const setOps = this.metrics.operations.set.count;
    const totalOps = getOps + setOps;

    if (totalOps > 0) {
      this.metrics.performance.avgGetTime = getOps > 0 ? this.metrics.operations.get.totalTime / getOps : 0;
      this.metrics.performance.avgSetTime = setOps > 0 ? this.metrics.operations.set.totalTime / setOps : 0;
      this.metrics.performance.errorRate =
        (this.metrics.operations.get.errors + this.metrics.operations.set.errors) / totalOps;
    }

    // Update memory metrics from Redis info
    this.updateMemoryMetrics();

    this.metrics.timestamp = Date.now();
  }

  private async updateMemoryMetrics(): Promise<void> {
    try {
      const info = await this.info('memory');
      const lines = info.split('\r\n');

      for (const line of lines) {
        if (line.startsWith('keyspace_hits:')) {
          this.metrics.memory.keyspaceHits = parseInt(line.split(':')[1]);
        } else if (line.startsWith('keyspace_misses:')) {
          this.metrics.memory.keyspaceMisses = parseInt(line.split(':')[1]);
        } else if (line.startsWith('evicted_keys:')) {
          this.metrics.memory.evictions = parseInt(line.split(':')[1]);
        }
      }

      // Calculate hit rate
      const totalAccess = this.metrics.memory.keyspaceHits + this.metrics.memory.keyspaceMisses;
      this.metrics.performance.hitRate = totalAccess > 0 ? this.metrics.memory.keyspaceHits / totalAccess : 0;
    } catch (error) {
      // Ignore metrics update errors
    }
  }

  private updateOperationMetrics(operation: 'get' | 'set' | 'del' | 'keys', duration: number, success: boolean): void {
    const metrics = this.metrics.operations[operation];
    metrics.count++;
    metrics.totalTime += duration;
    if (!success) {
      metrics.errors++;
    }
  }

  // Utility methods
  private initializeMetrics(): RedisMetrics {
    return {
      operations: {
        get: { count: 0, totalTime: 0, errors: 0 },
        set: { count: 0, totalTime: 0, errors: 0 },
        del: { count: 0, totalTime: 0, errors: 0 },
        keys: { count: 0, totalTime: 0, errors: 0 }
      },
      performance: {
        avgGetTime: 0,
        avgSetTime: 0,
        hitRate: 0,
        errorRate: 0,
        throughput: 0
      },
      memory: {
        cacheSize: 0,
        evictions: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0
      },
      timestamp: Date.now()
    };
  }

  private initializeHealthStatus(): RedisHealthStatus {
    return {
      status: 'unhealthy',
      connected: false,
      latency: 0,
      memory: {
        used: 0,
        max: 0,
        percentage: 0
      },
      connections: {
        active: 0,
        total: 0
      },
      lastCheck: 0,
      failures: 0
    };
  }

  private mergeConfig(userConfig?: Partial<RedisL2AdapterConfig>): RedisL2AdapterConfig {
    const defaultConfig: RedisL2AdapterConfig = {
      redis: {
        host: 'localhost',
        port: 6379,
        password: undefined,
        database: 0,
        keyPrefix: 'signal_cache:',
        maxRetries: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        connectionTimeout: 10000,
        commandTimeout: 5000
      },
      clustering: {
        enabled: false,
        nodes: [],
        options: {
          redisOptions: {},
          maxRedirections: 3,
          retryDelayOnFailover: 100
        }
      },
      healthCheck: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        maxFailures: 3
      },
      performance: {
        pipelining: true,
        batchSize: 100,
        compression: false,
        compressionThreshold: 1024, // 1KB
        serialization: 'json'
      },
      monitoring: {
        enabled: true,
        slowLogThreshold: 100, // 100ms
        metricsInterval: 60000, // 1 minute
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

  // Public API
  async disconnect(): Promise<void> {
    this.isShuttingDown = true;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.client) {
      await this.client.disconnect();
      this.client = undefined;
    }

    console.log('🔌 Redis L2 adapter disconnected');
  }

  isConnected(): boolean {
    return this.healthStatus.connected;
  }

  getHealthStatus(): RedisHealthStatus {
    return { ...this.healthStatus };
  }

  getMetrics(): RedisMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getClient(): any {
    return this.client;
  }

  // Advanced operations
  async flushAll(): Promise<void> {
    if (!this.client || !this.healthStatus.connected) {
      throw new Error('Redis L2 not connected');
    }

    await this.client.flushall();
    console.log('🗑️ Redis L2 cache flushed');
  }

  async getDatabaseSize(): Promise<number> {
    if (!this.client || !this.healthStatus.connected) {
      return 0;
    }

    try {
      const info = await this.info('keyspace');
      const match = info.match(/db\d+:keys=(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      console.warn('Failed to get database size:', error);
      return 0;
    }
  }

  async scanPattern(pattern: string, count: number = 100): Promise<string[]> {
    if (!this.client || !this.healthStatus.connected) {
      return [];
    }

    const keys: string[] = [];
    let cursor = '0';

    do {
      try {
        const result = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = result[0];
        keys.push(...result[1]);
      } catch (error) {
        console.warn('Redis scan failed:', error);
        break;
      }
    } while (cursor !== '0');

    return keys;
  }
}