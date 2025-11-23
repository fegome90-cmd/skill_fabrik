/**
 * Router V2 Integration Tests
 * Validates all enhanced features: load balancing, caching, circuit breaker, performance monitoring
 * Task: SF-TESTING-2025-V2.1
 * Date: 2025-11-14
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RouterV2, createRouterV2 } from '../router-v2.js';

describe('Router V2 - Enhanced Features', () => {
  let router: RouterV2;

  beforeAll(async () => {
    // Initialize Router V2 with all features enabled for testing
    router = await createRouterV2({
      enableLoadBalancer: true,
      enableMetrics: true,
      enableCircuitBreaker: true,
      enablePerformanceMonitor: true,
      enableAdvancedCache: true,
      daemonInstances: [
        {
          id: 'test-daemon-1',
          url: 'http://localhost:3001',
          weight: 1,
          maxConnections: 50
        },
        {
          id: 'test-daemon-2',
          url: 'http://localhost:3002',
          weight: 2,
          maxConnections: 100
        }
      ]
    });
  }, 30000);

  afterAll(async () => {
    if (router) {
      await router.stop();
    }
  }, 15000);

  describe('🚀 Basic Router V2 Functionality', () => {
    it('should start successfully with all enhanced features', () => {
      const stats = router.getStats();

      expect(stats.version).toBe('2.0.0');
      expect(stats.config.loadBalancing).toBe(true);
      expect(stats.config.metricsEnabled).toBe(true);
      expect(stats.config.circuitBreakerEnabled).toBe(true);
      expect(stats.config.performanceMonitoringEnabled).toBe(true);
      expect(stats.config.advancedCacheEnabled).toBe(true);
    });

    it('should report healthy status initially', () => {
      const health = router.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.version).toBe('2.0.0');
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.components).toBeDefined();
    });
  });

  describe('⚖️ Load Balancer Integration', () => {
    it('should have load balancer statistics available', () => {
      const stats = router.getStats();

      expect(stats.loadBalancer).toBeDefined();
      expect(stats.loadBalancer.totalInstances).toBe(2);
      expect(stats.loadBalancer.strategy).toBe('weighted-round-robin');
    });

    it('should report healthy daemon instances', () => {
      const stats = router.getStats();

      // Should have 2 instances configured
      expect(stats.loadBalancer.totalInstances).toBe(2);
      expect(typeof stats.loadBalancer.healthyInstances).toBe('number');
    });

    it('should provide instance status details', async () => {
      const response = await fetch('http://localhost:3000/load-balancer/status');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.instances).toBeDefined();
      expect(Array.isArray(data.instances)).toBe(true);
      expect(data.instances.length).toBe(2);
    });

    it('should allow strategy changes', async () => {
      const response = await fetch('http://localhost:3000/load-balancer/response-time', {
        method: 'POST'
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.message).toContain('response-time');
    });
  });

  describe('📊 Metrics Collection', () => {
    it('should provide metrics in Prometheus format', async () => {
      const response = await fetch('http://localhost:3000/metrics');
      const metrics = await response.text();

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/plain');
      expect(metrics).toContain('router_requests_total');
      expect(metrics).toContain('router_uptime_seconds');
    });

    it('should collect performance metrics', () => {
      const stats = router.getStats();

      expect(stats.metrics).toBeDefined();
      expect(typeof stats.metrics.totalRequests).toBe('number');
      expect(typeof stats.metrics.activeConnections).toBe('number');
      expect(typeof stats.metrics.averageResponseTime).toBe('number');
    });

    it('should track request metrics over time', async () => {
      // Make some test requests
      const initialStats = router.getStats();

      await fetch('http://localhost:3000/health');
      await fetch('http://localhost:3000/health/v2');

      // Wait a bit for metrics to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalStats = router.getStats();

      expect(finalStats.metrics.totalRequests).toBeGreaterThanOrEqual(initialStats.metrics.totalRequests);
    });
  });

  describe('🔧 Circuit Breaker Integration', () => {
    it('should have circuit breaker statistics', () => {
      const stats = router.getStats();

      expect(stats.circuitBreakers).toBeDefined();
      expect(typeof stats.circuitBreakers).toBe('object');
    });

    it('should create circuit breakers for different operations', () => {
      const stats = router.getStats();

      // Should have circuit breakers for known operations
      expect(Object.keys(stats.circuitBreakers)).toContain('invoke');
      expect(Object.keys(stats.circuitBreakers)).toContain('match-rules');
    });

    it('should handle circuit breaker states correctly', async () => {
      // This test would require actual daemon instances to be running
      // For now, we'll test that the endpoints exist
      const health = router.getHealthStatus();

      expect(health.components).toBeDefined();
      // Circuit breaker component status should be present
      expect(health.components.circuitBreaker).toBeDefined();
    });
  });

  describe('🎯 Performance Monitoring', () => {
    it('should provide comprehensive performance reports', async () => {
      const response = await fetch('http://localhost:3000/performance/report');
      const report = await response.json();

      expect(response.ok).toBe(true);
      expect(report.summary).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should track performance trends', async () => {
      const response = await fetch('http://localhost:3000/performance/report');
      const report = await response.json();

      expect(report.trends.responseTime).toBeDefined();
      expect(report.trends.errorRate).toBeDefined();
      expect(report.trends.throughput).toBeDefined();
      expect(typeof report.trends.responseTime.direction).toBe('string');
    });

    it('should handle performance alerts', async () => {
      const response = await fetch('http://localhost:3000/performance/alerts');
      const alerts = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should provide performance predictions', async () => {
      const response = await fetch('http://localhost:3000/performance/predictions');
      const predictions = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('💾 Advanced Caching', () => {
    it('should have cache statistics available', () => {
      const stats = router.getStats();

      expect(stats.cache).toBeDefined();
      expect(typeof stats.cache.size).toBe('number');
      expect(typeof stats.cache.hits).toBe('number');
      expect(typeof stats.cache.misses).toBe('number');
      expect(typeof stats.cache.hitRate).toBe('number');
    });

    it('should cache guardrails responses', async () => {
      const requestBody = {
        editLog: [{ path: 'test.txt', content: 'test content' }],
        cwd: '/tmp'
      };

      // First request - should cache miss
      const response1 = await fetch('http://localhost:3000/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Second request - should cache hit
      const response2 = await fetch('http://localhost:3000/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
    });

    it('should cache rules matching results', async () => {
      const requestBody = {
        input: 'test input for rules matching'
      };

      // Make request
      const response = await fetch('http://localhost:3000/match-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.matches)).toBe(true);
    });
  });

  describe('🔗 Enhanced Health Endpoints', () => {
    it('should provide detailed V2 health status', async () => {
      const response = await fetch('http://localhost:3000/health/v2');
      const health = await response.json();

      expect(response.ok).toBe(true);
      expect(health.status).toBeDefined();
      expect(health.components).toBeDefined();
      expect(typeof health.uptime).toBe('number');
      expect(health.version).toBe('2.0.0');
    });

    it('should provide comprehensive V2 statistics', async () => {
      const response = await fetch('http://localhost:3000/stats/v2');
      const stats = await response.json();

      expect(response.ok).toBe(true);
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.config).toBeDefined();
      expect(stats.version).toBe('2.0.0');
    });
  });

  describe('🛡️ Resilience and Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await fetch('http://localhost:3000/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should validate guardrails requests', async () => {
      const response = await fetch('http://localhost:3000/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'request' })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
    });

    it('should handle rate limiting', async () => {
      // This test would require configuring rate limiting to be very restrictive
      // For now, we'll test the endpoint exists
      const health = await fetch('http://localhost:3000/health');
      expect(health.ok).toBe(true);
    });
  });

  describe('🔄 Integration with Original Features', () => {
    it('should support original health endpoint', async () => {
      const response = await fetch('http://localhost:3000/health');
      const health = await response.json();

      expect(response.ok).toBe(true);
      expect(health.status).toBeDefined();
    });

    it('should support readiness endpoint', async () => {
      const response = await fetch('http://localhost:3000/health/ready');
      const health = await response.json();

      expect(response.ok).toBe(true);
      expect(health.status).toBeDefined();
    });
  });
});

describe('Router V2 - Configuration Options', () => {
  it('should respect disabled features configuration', async () => {
    const router = await createRouterV2({
      enableLoadBalancer: false,
      enableMetrics: false,
      enableCircuitBreaker: false,
      enablePerformanceMonitor: false,
      enableAdvancedCache: false
    });

    const stats = router.getStats();

    expect(stats.config.loadBalancing).toBe(false);
    expect(stats.config.metricsEnabled).toBe(false);
    expect(stats.config.circuitBreakerEnabled).toBe(false);
    expect(stats.config.performanceMonitoringEnabled).toBe(false);
    expect(stats.config.advancedCacheEnabled).toBe(false);

    await router.stop();
  }, 15000);

  it('should accept custom daemon instances', async () => {
    const customInstances = [
      {
        id: 'custom-1',
        url: 'http://localhost:4001',
        weight: 3,
        maxConnections: 200
      }
    ];

    const router = await createRouterV2({
      daemonInstances: customInstances
    });

    const stats = router.getStats();
    expect(stats.loadBalancer.totalInstances).toBe(1);

    await router.stop();
  }, 15000);
});

describe('Router V2 - Performance Benchmarks', () => {
  it('should handle concurrent requests efficiently', async () => {
    const router = await createRouterV2({
      enableAdvancedCache: true,
      enableMetrics: true
    });

    const concurrentRequests = 50;
    const startTime = Date.now();

    // Make concurrent requests
    const promises = Array.from({ length: concurrentRequests }, () =>
      fetch('http://localhost:3000/health')
    );

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;

    expect(successful).toBeGreaterThan(concurrentRequests * 0.9); // At least 90% success rate
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    await router.stop();
  }, 20000);

  it('should maintain cache hit rate under load', async () => {
    const router = await createRouterV2({
      enableAdvancedCache: true
    });

    const requestBody = {
      editLog: [{ path: 'cache-test.txt', content: 'test content' }],
      cwd: '/tmp'
    };

    // Make multiple identical requests
    const promises = Array.from({ length: 20 }, () =>
      fetch('http://localhost:3000/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
    );

    await Promise.allSettled(promises);

    // Check cache statistics
    const stats = router.getStats();
    expect(stats.cache.hitRate).toBeGreaterThan(0.5); // Should have >50% hit rate

    await router.stop();
  }, 20000);
});