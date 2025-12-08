/**
 * T4.2.2: Gate Results Cache Tests
 *
 * Unit tests for caching quality gate results to avoid re-execution.
 * Follows TDD: RED → GREEN → REFACTOR
 */

/* eslint-disable simple-import-sort/imports */
import { GateResultsCache } from '../../../src/scripts/gate-results-cache';
import type { GateExecutionResult } from '../../../src/scripts/quality-gates-orchestrator';
/* eslint-enable simple-import-sort/imports */

describe('GateResultsCache', () => {
  let cache: GateResultsCache;

  beforeEach(() => {
    cache = new GateResultsCache({ ttlMs: 5000 }); // 5 second TTL for tests
  });

  describe('get/set operations', () => {
    it('returns null for cache miss', () => {
      const result = cache.get('ESLint', 'abc123');
      expect(result).toBeNull();
    });

    it('returns cached result for cache hit with matching hash', () => {
      const mockResult: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };

      cache.set('ESLint', 'abc123', mockResult);
      const result = cache.get('ESLint', 'abc123');

      expect(result).toEqual(mockResult);
    });

    it('returns null when hash does not match', () => {
      const mockResult: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };

      cache.set('ESLint', 'abc123', mockResult);
      const result = cache.get('ESLint', 'different-hash');

      expect(result).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('returns null after TTL expires', async () => {
      const shortTtlCache = new GateResultsCache({ ttlMs: 50 }); // 50ms TTL
      const mockResult: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };

      shortTtlCache.set('ESLint', 'abc123', mockResult);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      const result = shortTtlCache.get('ESLint', 'abc123');
      expect(result).toBeNull();
    });

    it('returns result before TTL expires', () => {
      const mockResult: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };

      cache.set('ESLint', 'abc123', mockResult);
      const result = cache.get('ESLint', 'abc123');

      expect(result).toEqual(mockResult);
    });
  });

  describe('invalidation', () => {
    it('invalidates specific gate cache', () => {
      const result1: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };
      const result2: GateExecutionResult = {
        name: 'TypeScript',
        success: true,
        executionTime: 2000,
        output: 'TypeScript passed',
      };

      cache.set('ESLint', 'abc123', result1);
      cache.set('TypeScript', 'def456', result2);

      cache.invalidate('ESLint');

      expect(cache.get('ESLint', 'abc123')).toBeNull();
      expect(cache.get('TypeScript', 'def456')).toEqual(result2);
    });

    it('invalidates all gates when no name provided', () => {
      const result1: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };
      const result2: GateExecutionResult = {
        name: 'TypeScript',
        success: true,
        executionTime: 2000,
        output: 'TypeScript passed',
      };

      cache.set('ESLint', 'abc123', result1);
      cache.set('TypeScript', 'def456', result2);

      cache.invalidateAll();

      expect(cache.get('ESLint', 'abc123')).toBeNull();
      expect(cache.get('TypeScript', 'def456')).toBeNull();
    });
  });

  describe('cache stats', () => {
    it('tracks cache hits and misses', () => {
      const mockResult: GateExecutionResult = {
        name: 'ESLint',
        success: true,
        executionTime: 1000,
        output: 'ESLint passed',
      };

      cache.set('ESLint', 'abc123', mockResult);

      cache.get('ESLint', 'abc123'); // hit
      cache.get('ESLint', 'abc123'); // hit
      cache.get('ESLint', 'different'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.entries).toBe(1);
    });
  });
});
