/**
 * T4.2.2: Gate Results Cache
 *
 * Lightweight cache for quality gate results to avoid re-execution
 * when input hasn't changed. Uses TTL-based invalidation.
 */

import type { GateExecutionResult } from './quality-gates-orchestrator';

/**
 * Cache entry with metadata for validation
 */
export interface CacheEntry {
  result: GateExecutionResult;
  timestamp: number;
  inputHash: string;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  ttlMs: number; // Time-to-live in milliseconds (default: 5 minutes)
  maxEntries?: number; // Maximum cache entries (default: 100)
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
}

/**
 * In-memory cache for gate execution results
 */
export class GateResultsCache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private hits: number;
  private misses: number;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.ttlMs = config.ttlMs;
    this.maxEntries = config.maxEntries ?? 100;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached result for a gate if valid
   * @param gateName - Name of the quality gate
   * @param inputHash - Hash of the input files/state
   * @returns Cached result or null if cache miss
   */
  get(gateName: string, inputHash: string): GateExecutionResult | null {
    const key = this.createKey(gateName);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if hash matches
    if (entry.inputHash !== inputHash) {
      this.misses++;
      return null;
    }

    // Check if TTL expired
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.result;
  }

  /**
   * Cache a gate execution result
   * @param gateName - Name of the quality gate
   * @param inputHash - Hash of the input files/state
   * @param result - Gate execution result to cache
   */
  set(gateName: string, inputHash: string, result: GateExecutionResult): void {
    // Enforce max entries limit
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const key = this.createKey(gateName);
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      inputHash,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache for a specific gate
   * @param gateName - Name of the gate to invalidate
   */
  invalidate(gateName: string): void {
    const key = this.createKey(gateName);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cached entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.cache.size,
    };
  }

  /**
   * Check if a cache entry is still valid (not expired)
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.ttlMs;
  }

  /**
   * Create cache key from gate name
   */
  private createKey(gateName: string): string {
    return `gate:${gateName}`;
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
