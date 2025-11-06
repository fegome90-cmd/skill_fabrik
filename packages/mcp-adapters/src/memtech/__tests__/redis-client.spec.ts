/**
 * Tests for Redis client with reconnection and resilience patterns
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setL1Item, getL1Item, deleteL1Item, testConnection, closeRedisConnection } from '../redis-client.js';
import { resetConfig } from '../config.js';

// Mock Redis if not available
const isRedisAvailable = process.env.REDIS_URL_CORE || process.env.MEMTECH_REDIS_CORE_HOST;

describe('Redis Client - L1 Operations', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(async () => {
    await closeRedisConnection();
  });

  it('should test connection', async () => {
    if (!isRedisAvailable) {
      console.warn('Redis not configured, skipping test');
      return;
    }

    const result = await testConnection();
    expect(result).toHaveProperty('connected');
    expect(result).toHaveProperty('latency');
  }, 10000); // 10s timeout

  it('should store and retrieve item from L1', async () => {
    if (!isRedisAvailable) {
      console.warn('Redis not configured, skipping test');
      return;
    }

    const testKey = `test-${Date.now()}`;
    const testValue = JSON.stringify({ test: 'data', timestamp: Date.now() });

    // Store
    await setL1Item(testKey, testValue, 60); // 60 seconds TTL

    // Retrieve
    const retrieved = await getL1Item(testKey);
    expect(retrieved).toBe(testValue);

    // Cleanup
    await deleteL1Item(testKey);
  }, 10000);

  it('should return null for non-existent key (graceful degradation)', async () => {
    if (!isRedisAvailable) {
      console.warn('Redis not configured, skipping test');
      return;
    }

    const retrieved = await getL1Item('non-existent-key-12345');
    expect(retrieved).toBeNull();
  }, 10000);

  it('should handle TTL correctly', async () => {
    if (!isRedisAvailable) {
      console.warn('Redis not configured, skipping test');
      return;
    }

    const testKey = `test-ttl-${Date.now()}`;
    const testValue = 'ttl-test-value';

    // Store with 2 second TTL
    await setL1Item(testKey, testValue, 2);

    // Should be available immediately
    const immediate = await getL1Item(testKey);
    expect(immediate).toBe(testValue);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Should be null after TTL
    const expired = await getL1Item(testKey);
    expect(expired).toBeNull();
  }, 5000);
});

describe('Redis Client - Error Handling', () => {
  it('should handle invalid configuration gracefully', async () => {
    // Set invalid config
    process.env.REDIS_URL_CORE = 'redis://invalid-host:9999';
    resetConfig();

    // Should handle gracefully (testConnection returns error info, not throw)
    const result = await testConnection();
    expect(result.connected).toBe(false);
    expect(result.error).toBeDefined();
  }, 5000);
});

