# Ejemplos de Código - Correcciones Implementables
## Skills Fabrik - Código Listo para Implementar

**Fecha:** 2025-11-05  
**Complemento al:** INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md

---

## 1. Graceful Shutdown Completo para Router

### Archivo: `packages/router/src/shutdown.ts` (NUEVO)

```typescript
import type { FastifyInstance } from 'fastify';
import { daemonCache } from './pre-invoke.js';

interface ShutdownOptions {
  timeout?: number;
  logger?: any;
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    private server: FastifyInstance,
    private options: ShutdownOptions = {}
  ) {
    this.setupSignalHandlers();
  }
  
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes)
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.options.logger?.error({ error }, 'Uncaught exception');
      this.shutdown('uncaughtException', 1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.options.logger?.error({ reason, promise }, 'Unhandled rejection');
      this.shutdown('unhandledRejection', 1);
    });
  }
  
  private async shutdown(signal: string, exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      this.options.logger?.warn({ signal }, 'Shutdown already in progress');
      return;
    }
    
    this.isShuttingDown = true;
    this.options.logger?.info({ signal }, '🛑 Received shutdown signal, shutting down gracefully...');
    
    // Set timeout for forced shutdown
    const timeout = this.options.timeout || 30000; // 30 segundos por defecto
    this.shutdownTimeout = setTimeout(() => {
      this.options.logger?.error('⏰ Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, timeout);
    
    try {
      // 1. Stop accepting new connections
      this.options.logger?.info('📡 Closing server...');
      await this.server.close();
      this.options.logger?.info('✅ Server closed');
      
      // 2. Clear caches
      this.options.logger?.info('🗑️  Clearing caches...');
      daemonCache.clear();
      this.options.logger?.info('✅ Caches cleared');
      
      // 3. Clear any pending timers (if tracked)
      // ... cleanup logic
      
      // 4. Close database connections (if any)
      // ... db cleanup
      
      this.options.logger?.info('✅ Shutdown complete');
      
      // Clear timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      process.exit(exitCode);
    } catch (error) {
      this.options.logger?.error({ error }, '❌ Error during shutdown');
      
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      process.exit(1);
    }
  }
  
  // Health check endpoint helper
  isHealthy(): boolean {
    return !this.isShuttingDown;
  }
}
```

### Archivo: `packages/router/src/server.ts` (MODIFICADO)

```typescript
import { GracefulShutdown } from './shutdown.js';

export async function startServer() {
  try {
    const server = await createServer();
    
    // Setup graceful shutdown
    const shutdown = new GracefulShutdown(server, {
      timeout: 30000,
      logger: console // Reemplazar con logger estructurado
    });
    
    // Add health check that considers shutdown state
    server.get('/health', async (request, reply) => {
      if (!shutdown.isHealthy()) {
        return reply.code(503).send({
          status: 'shutting_down',
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    });
    
    await server.listen({ port: PORT, host: HOST });
    
    console.log(`🚀 Router service started on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    
    // Signal PM2 that server is ready
    if (process.send) {
      process.send('ready');
    }
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start router service:', error);
    process.exit(1);
  }
}
```

---

## 3. Circuit Breaker para Router

### Archivo: `packages/router/src/resilience/circuit-breaker.ts` (NUEVO)

```typescript
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  successThreshold: number;
  resetTimeout: number;
  timeout: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private stats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    timeouts: 0,
    circuitOpened: 0
  };

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.stats.circuitOpened++;
        throw new CircuitBreakerError(
          `Circuit breaker '${this.options.name}' is OPEN`,
          this.state
        );
      }
      // Try to close circuit
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            this.stats.timeouts++;
            reject(new Error('Circuit breaker timeout'));
          }, this.options.timeout)
        )
      ]);

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.successfulCalls++;
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.stats.failedCalls++;
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      ...this.stats,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}
```

### Uso en `packages/router/src/pre-invoke.ts`:

```typescript
import { CircuitBreaker, CircuitBreakerError } from './resilience/circuit-breaker.js';

// Crear circuit breaker global
const daemonCircuitBreaker = new CircuitBreaker({
  name: 'daemon-activate',
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000,
  timeout: 5000
});

async function enhanceWithDaemonResults(
  input: PreHookInput,
  output: PreHookOutput,
  threshold: number
): Promise<void> {
  const daemonUrl = process.env.DAEMON_URL || 'http://localhost:3000';

  try {
    const json = await daemonCircuitBreaker.execute(async () => {
      const res = await fetch(`${daemonUrl}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': input.requestId || 'unknown'
        },
        body: JSON.stringify({
          prompt: input.prompt,
          cwd: input.cwd,
          threshold
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res.json();
    });

    // Process response...
    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).daemon = {
      success: true,
      results: json.results,
      circuitState: daemonCircuitBreaker.getState()
    };
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      console.warn(`[Daemon] Circuit breaker ${error.state}, skipping daemon call`);
      output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
      (output.metadata as any).daemon = {
        success: false,
        error: 'circuit_breaker_open',
        circuitState: daemonCircuitBreaker.getState(),
        stats: daemonCircuitBreaker.getStats()
      };
      return;
    }

    console.error('[Daemon] Error calling daemon:', error);
    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).daemon = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      circuitState: daemonCircuitBreaker.getState()
    };
  }
}
```

---

## 4. File Watcher Shutdown Asíncrono

### Archivo: `packages/daemon/src/fileWatcher.ts` (MODIFICADO)

```typescript
async stop(): Promise<void> {
  this.logger.info('Stopping file watching service...');

  // 1. Set stopping flag to prevent new operations
  this.stopping = true;

  // 2. Clear all debouncers
  const debouncerCount = this.qualityCheckDebouncers.size;
  this.qualityCheckDebouncers.forEach((timers, path) => {
    clearTimeout(timers.debouncer);
    if (timers.failsafe) {
      clearTimeout(timers.failsafe);
    }
    this.logger.debug({ path }, 'Cleared quality check debouncer');
  });
  this.qualityCheckDebouncers.clear();
  this.logger.info({ clearedDebouncers: debouncerCount }, 'Cleared all debouncers');

  // 3. Wait for event loop to clear pending callbacks
  await new Promise(resolve => setImmediate(resolve));

  // 4. Stop all file watchers
  const watcherPaths = Array.from(this.watchers.keys());
  this.logger.info({ watcherCount: watcherPaths.length }, 'Stopping file watchers...');

  const watcherClosePromises = watcherPaths.map(async (path) => {
    const watcher = this.watchers.get(path);
    if (!watcher) return;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout closing watcher for ${path}`));
        }, 5000);

        watcher.close();
        watcher.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.logger.debug({ path }, 'Stopped file watcher');
    } catch (error) {
      this.logger.warn({
        path,
        error: error instanceof Error ? error.message : String(error)
      }, 'Error stopping file watcher');
    }
  });

  const watcherResults = await Promise.allSettled(watcherClosePromises);
  const failedWatchers = watcherResults.filter(r => r.status === 'rejected').length;

  this.watchers.clear();
  this.logger.info({
    stoppedWatchers: watcherPaths.length - failedWatchers,
    failedWatchers
  }, 'File watchers stopped');

  // 5. Close WebSocket server
  if (this.wss) {
    this.logger.info('Closing WebSocket server...');

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout closing WebSocket server'));
        }, 5000);

        this.wss!.close((err) => {
          clearTimeout(timeout);
          if (err) reject(err);
          else resolve();
        });
      });

      this.logger.info('WebSocket server closed');
    } catch (error) {
      this.logger.warn({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error closing WebSocket server');
    }

    this.wss = null;
  }

  // 6. Close all WebSocket clients
  const clientCount = this.clients.size;
  if (clientCount > 0) {
    this.logger.info({ clientCount }, 'Closing WebSocket clients...');

    const clientClosePromises = Array.from(this.clients).map(client => {
      return new Promise<void>((resolve) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1000, 'Server shutting down');

          const timeout = setTimeout(() => {
            client.terminate();
            resolve();
          }, 1000);

          client.once('close', () => {
            clearTimeout(timeout);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });

    await Promise.allSettled(clientClosePromises);
  }

  this.clients.clear();
  this.logger.info({
    disconnectedClients: clientCount
  }, 'File watching service stopped successfully');
}
```

---

## 5. Tests Unitarios para las Correcciones

### Archivo: `packages/router/src/__tests__/lru-cache.test.ts` (NUEVO)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRUCache } from '../cache/lru-cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, any>;

  beforeEach(() => {
    cache = new LRUCache({
      maxSize: 3,
      ttl: 1000,
      cleanupInterval: 100
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should evict LRU entry when full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Access key1 to make it recently used
    cache.get('key1');

    // Add key4, should evict key2 (least recently used)
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should expire entries after TTL', async () => {
    cache.set('key1', 'value1', 100);
    expect(cache.get('key1')).toBe('value1');

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get('key1')).toBeNull();
  });

  it('should track cache statistics', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('key2'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('should call onEvict callback', () => {
    const onEvict = vi.fn();
    const cacheWithCallback = new LRUCache({
      maxSize: 2,
      ttl: 1000,
      onEvict
    });

    cacheWithCallback.set('key1', 'value1');
    cacheWithCallback.set('key2', 'value2');
    cacheWithCallback.set('key3', 'value3'); // Should evict key1

    expect(onEvict).toHaveBeenCalledWith('key1', expect.any(Object));

    cacheWithCallback.destroy();
  });
});
```

---

**Fin de Ejemplos de Código**
## 2. LRU Cache con Cleanup Automático

### Archivo: `packages/router/src/cache/lru-cache.ts` (NUEVO)

```typescript
export interface CacheEntry<V> {
  value: V;
  timestamp: number;
  ttl: number;
  lastAccess: number;
  accessCount: number;
}

export interface LRUCacheOptions {
  maxSize: number;
  ttl: number;
  cleanupInterval?: number;
  onEvict?: (key: string, entry: CacheEntry<any>) => void;
}

export class LRUCache<K extends string, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0
  };
  
  constructor(private options: LRUCacheOptions) {
    // Start cleanup interval
    const interval = options.cleanupInterval || 30000; // 30 segundos
    this.cleanupTimer = setInterval(() => this.cleanup(), interval);
  }
  
  get(key: K): V | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.expirations++;
      return null;
    }
    
    // Update access info for LRU
    entry.lastAccess = now;
    entry.accessCount++;
    this.stats.hits++;
    
    return entry.value;
  }
  
  set(key: K, value: V, ttl?: number): void {
    // Evict LRU if at capacity
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl || this.options.ttl,
      lastAccess: now,
      accessCount: 1
    });
  }
  
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }
    
    return true;
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }
  
  private evictLRU(): void {
    let oldestKey: K | null = null;
    let oldestAccess = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      
      if (entry && this.options.onEvict) {
        this.options.onEvict(oldestKey, entry);
      }
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: K[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      const entry = this.cache.get(key);
      this.cache.delete(key);
      this.stats.expirations++;
      
      if (entry && this.options.onEvict) {
        this.options.onEvict(key, entry);
      }
    });
  }
  
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
  
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}
```

---


