/**
 * LRU Cache Implementation
 * Task: SF-STABILITY-2025-T2.1
 * Date: 2025-11-05
 */

export interface LRUCacheOptions {
  maxSize: number;
  ttl: number;
  cleanupInterval?: number;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  hitRate: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[];
  private options: Required<LRUCacheOptions>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0
  };
  
  constructor(options: LRUCacheOptions) {
    this.cache = new Map();
    this.accessOrder = [];
    this.options = {
      maxSize: options.maxSize,
      ttl: options.ttl,
      cleanupInterval: options.cleanupInterval || 30000 // 30 seconds default
    };
    
    // Start periodic cleanup
    this.startCleanup();
  }
  
  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.expirations++;
      this.stats.misses++;
      return undefined;
    }
    
    // Update access tracking
    entry.accessCount++;
    entry.lastAccess = now;
    this.updateAccessOrder(key);
    this.stats.hits++;
    
    return entry.value;
  }
  
  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    
    // If key exists, update it
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.ttl = ttl || this.options.ttl;
      entry.lastAccess = now;
      entry.accessCount++;
      this.updateAccessOrder(key);
      return;
    }
    
    // Check if we need to evict
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl || this.options.ttl,
      accessCount: 1,
      lastAccess: now
    });
    
    this.accessOrder.push(key);
  }
  
  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0
    };
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder.shift()!;
    this.cache.delete(lruKey);
    this.stats.evictions++;
  }
  
  /**
   * Update access order (move to end)
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }
  
  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);

    // Don't prevent process from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.expirations++;
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

