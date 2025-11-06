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
export declare class Cache<K, V> {
    private config;
    private cache;
    private accessOrder;
    private accessCounter;
    private cleanupTimer?;
    private hits;
    private misses;
    private storagePath;
    constructor(config: CacheConfig);
    private generateKey;
    private initPersistentCache;
    get(key: K): V | undefined;
    /**
     * Async get with persistent storage support
     */
    getAsync(key: K): Promise<V | undefined>;
    /**
     * Get or set with async factory function - Plan-Architect optimization
     */
    getOrSet(key: K, factory: () => Promise<V>, ttl?: number): Promise<V>;
    set(key: K, value: V, ttl?: number): void;
    /**
     * Async set with persistent storage support
     */
    setAsync(key: K, value: V, ttl?: number): Promise<void>;
    delete(key: K): boolean;
    has(key: K): boolean;
    clear(): void;
    private cleanup;
    private evictLRU;
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        hits: number;
        misses: number;
        memoryUsage: NodeJS.MemoryUsage;
        storagePath: string;
    };
    /**
     * Display cache dashboard with professional formatting
     */
    showDashboard(): void;
    destroy(): void;
}
export declare const cliCache: Cache<string, any>;
/**
 * Cache decorator for async functions - Plan-Architect optimization
 */
export declare function cached<T extends any[], R>(keyPrefix: string, ttl?: number): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Memoization utility for expensive computations with Plan-Architect optimizations
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T, ttl?: number): T;
//# sourceMappingURL=cache.d.ts.map