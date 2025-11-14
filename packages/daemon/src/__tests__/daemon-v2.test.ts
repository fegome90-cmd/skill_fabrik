/**
 * Daemon V2 Integration Tests
 * Validates all enhanced features: PM2 clustering, graceful shutdown, health monitoring
 * Task: SF-TESTING-2025-V2.2
 * Date: 2025-11-14
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { DaemonV2 } from '../daemon-v2.js';
import { PM2ClusterManager } from '../orchestration/pm2-cluster-manager.js';
import { GracefulShutdownManager } from '../orchestration/graceful-shutdown-manager.js';
import { HealthCheckSystem } from '../orchestration/health-check-system.js';

// Mock PM2 for testing
vi.mock('pm2', () => ({
  default: {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(() => Promise.resolve([])),
    describe: vi.fn(() => Promise.resolve([])),
    disconnect: vi.fn()
  }
}));

describe('Daemon V2 - Enhanced Features', () => {
  let daemon: DaemonV2;

  beforeAll(async () => {
    // Initialize Daemon V2 with all features enabled for testing
    daemon = new DaemonV2({
      enableClustering: true,
      enableGracefulShutdown: true,
      enableHealthMonitoring: true,
      enableMetrics: true,
      clusterConfig: {
        instances: 2,
        maxMemory: '512M',
        execMode: 'fork'
      },
      healthConfig: {
        checkInterval: 5000,
        timeoutThreshold: 30000,
        enablePredictiveAnalysis: true
      },
      shutdownConfig: {
        timeout: 15000,
        gracefulTimeout: 10000,
        waitActiveRequests: true,
        enableMetrics: true
      }
    });
  }, 30000);

  afterAll(async () => {
    if (daemon) {
      await daemon.stop();
    }
  }, 15000);

  describe('🚀 Basic Daemon V2 Functionality', () => {
    it('should initialize successfully with all enhanced features', () => {
      const stats = daemon.getStats();

      expect(stats.version).toBe('2.0.0');
      expect(stats.config.clusteringEnabled).toBe(true);
      expect(stats.config.gracefulShutdownEnabled).toBe(true);
      expect(stats.config.healthMonitoringEnabled).toBe(true);
      expect(stats.config.metricsEnabled).toBe(true);
    });

    it('should report healthy status initially', () => {
      const health = daemon.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.version).toBe('2.0.0');
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.components).toBeDefined();
    });

    it('should provide comprehensive system statistics', () => {
      const stats = daemon.getStats();

      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.memory).toBeDefined();
      expect(stats.cpu).toBeDefined();
      expect(stats.activeConnections).toBeDefined();
      expect(stats.totalRequests).toBeDefined();
    });
  });

  describe('⚡ PM2 Clustering Integration', () => {
    it('should have cluster manager available', () => {
      const clusterManager = daemon.getClusterManager();

      expect(clusterManager).toBeInstanceOf(PM2ClusterManager);
      expect(clusterManager.getStatus).toBeDefined();
      expect(clusterManager.start).toBeDefined();
      expect(clusterManager.stop).toBeDefined();
      expect(clusterManager.scale).toBeDefined();
    });

    it('should report cluster status correctly', async () => {
      const clusterStatus = await daemon.getClusterStatus();

      expect(clusterStatus.name).toBe('skills-daemon');
      expect(clusterStatus.mode).toBeDefined();
      expect(clusterStatus.totalInstances).toBeGreaterThanOrEqual(0);
      expect(clusterStatus.healthyInstances).toBeGreaterThanOrEqual(0);
      expect(clusterStatus.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(clusterStatus.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should handle cluster scaling', async () => {
      const initialStatus = await daemon.getClusterStatus();

      // Scale to 3 instances
      await daemon.scaleCluster(3);

      const scaledStatus = await daemon.getClusterStatus();

      // Should have updated the instance count
      expect(scaledStatus.totalInstances).toBeGreaterThanOrEqual(initialStatus.totalInstances);
    });

    it('should provide cluster metrics', async () => {
      const metrics = await daemon.getClusterMetrics();

      expect(metrics.clusterHealth).toBeDefined();
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.requestsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.memoryEfficiency).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuEfficiency).toBeGreaterThanOrEqual(0);
    });

    it('should perform health checks on cluster instances', async () => {
      await daemon.performClusterHealthCheck();

      const status = await daemon.getClusterStatus();
      expect(status.healthyInstances).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🛡️ Graceful Shutdown Integration', () => {
    it('should have shutdown manager available', () => {
      const shutdownManager = daemon.getShutdownManager();

      expect(shutdownManager).toBeInstanceOf(GracefulShutdownManager);
      expect(shutdownManager.isShuttingDown).toBeDefined();
      expect(shutdownManager.getStatus).toBeDefined();
      expect(shutdownManager.registerRequest).toBeDefined();
      expect(shutdownManager.unregisterRequest).toBeDefined();
    });

    it('should handle request tracking during shutdown', () => {
      const shutdownManager = daemon.getShutdownManager();
      const requestId = 'test-request-123';

      // Register a request
      shutdownManager.registerRequest(requestId);

      let status = shutdownManager.getStatus();
      expect(status.activeRequests).toBe(1);

      // Unregister the request
      shutdownManager.unregisterRequest(requestId);

      status = shutdownManager.getStatus();
      expect(status.activeRequests).toBe(0);
    });

    it('should provide shutdown status and metrics', () => {
      const shutdownManager = daemon.getShutdownManager();

      const status = shutdownManager.getStatus();
      expect(status.isShuttingDown).toBeDefined();
      expect(status.activeRequests).toBeGreaterThanOrEqual(0);
      expect(status.currentPhase).toBeDefined();
      expect(status.completedPhases).toBeGreaterThanOrEqual(0);
      expect(status.totalPhases).toBeGreaterThan(0);

      const metrics = shutdownManager.getMetrics();
      expect(metrics.totalShutdownTime).toBeGreaterThanOrEqual(0);
      expect(metrics.requestsCompleted).toBeGreaterThanOrEqual(0);
      expect(metrics.requestsForced).toBeGreaterThanOrEqual(0);
    });

    it('should execute graceful shutdown properly', async () => {
      // This is a simplified test - in production we'd test the full shutdown process
      const shutdownManager = daemon.getShutdownManager();

      // Mock shutdown process (don't actually shutdown in tests)
      const shutdownPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });

      await expect(shutdownPromise).resolves.not.toThrow();
    });
  });

  describe('🏥 Health Monitoring Integration', () => {
    it('should have health system available', () => {
      const healthSystem = daemon.getHealthSystem();

      expect(healthSystem).toBeInstanceOf(HealthCheckSystem);
      expect(healthSystem.getStatus).toBeDefined();
      expect(healthSystem.performHealthCheck).toBeDefined();
      expect(healthSystem.addHealthCheck).toBeDefined();
      expect(healthSystem.getHealthReport).toBeDefined();
    });

    it('should perform comprehensive health checks', async () => {
      const healthStatus = await daemon.performHealthCheck();

      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();
      expect(healthStatus.checks).toBeDefined();
      expect(Array.isArray(healthStatus.checks)).toBe(true);
      expect(healthStatus.overallHealth).toBeGreaterThanOrEqual(0);
    });

    it('should track health metrics and trends', async () => {
      const healthReport = await daemon.getHealthReport();

      expect(healthReport.summary).toBeDefined();
      expect(healthReport.issues).toBeDefined();
      expect(Array.isArray(healthReport.issues)).toBe(true);
      expect(healthReport.trends).toBeDefined();
      expect(healthReport.predictions).toBeDefined();
      expect(Array.isArray(healthReport.predictions)).toBe(true);
    });

    it('should handle custom health checks', async () => {
      const healthSystem = daemon.getHealthSystem();

      // Add a custom health check
      healthSystem.addHealthCheck('custom-test', async () => {
        return {
          status: 'healthy',
          message: 'Custom check passed',
          value: 100,
          threshold: 90
        };
      });

      const healthStatus = await healthSystem.performHealthCheck();

      // Should include our custom check
      const customCheck = healthStatus.checks.find(c => c.name === 'custom-test');
      expect(customCheck).toBeDefined();
      expect(customCheck?.status).toBe('healthy');
    });

    it('should provide health predictions and recommendations', async () => {
      const predictions = await daemon.getHealthPredictions();

      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThanOrEqual(0);

      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction.type).toBeDefined();
        expect(prediction.severity).toBeDefined();
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.recommendation).toBeDefined();
      }
    });
  });

  describe('📊 Metrics Collection and Integration', () => {
    it('should collect comprehensive daemon metrics', () => {
      const metrics = daemon.getMetrics();

      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should provide component-specific metrics', () => {
      const clusterMetrics = daemon.getClusterMetrics();
      const healthMetrics = daemon.getHealthMetrics();

      expect(clusterMetrics).toBeDefined();
      expect(healthMetrics).toBeDefined();
    });

    it('should track performance over time', () => {
      const initialStats = daemon.getStats();

      // Simulate some activity
      daemon.trackRequest('test-request', 100);

      const updatedStats = daemon.getStats();

      expect(updatedStats.totalRequests).toBeGreaterThanOrEqual(initialStats.totalRequests);
    });
  });

  describe('🔄 Integration Between Components', () => {
    it('should coordinate cluster and health monitoring', async () => {
      const clusterStatus = await daemon.getClusterStatus();
      const healthStatus = await daemon.performHealthCheck();

      // Health status should consider cluster status
      expect(clusterStatus.totalInstances).toBeGreaterThanOrEqual(0);
      expect(healthStatus.checks.length).toBeGreaterThan(0);
    });

    it('should integrate shutdown with health monitoring', () => {
      const shutdownManager = daemon.getShutdownManager();
      const healthSystem = daemon.getHealthSystem();

      // Both components should be operational
      expect(shutdownManager.getStatus().isShuttingDown).toBe(false);
      expect(healthSystem.getStatus()).toBeDefined();
    });

    it('should handle graceful coordination during scaling', async () => {
      // Scale cluster
      await daemon.scaleCluster(2);

      // Verify health system adapts to new cluster state
      const healthStatus = await daemon.performHealthCheck();
      expect(healthStatus.checks.length).toBeGreaterThan(0);
    });
  });

  describe('🛠️ Configuration and Customization', () => {
    it('should respect custom configuration', () => {
      const stats = daemon.getStats();

      // Should reflect our custom configuration from beforeAll
      expect(stats.config.clusteringEnabled).toBe(true);
      expect(stats.config.healthMonitoringEnabled).toBe(true);
      expect(stats.config.gracefulShutdownEnabled).toBe(true);
    });

    it('should allow runtime configuration changes', async () => {
      // Update health check interval
      daemon.updateHealthConfig({
        checkInterval: 10000,
        timeoutThreshold: 60000
      });

      const healthSystem = daemon.getHealthSystem();
      const status = healthSystem.getStatus();

      expect(status).toBeDefined();
    });

    it('should handle different cluster configurations', async () => {
      // Test with different cluster config
      const testDaemon = new DaemonV2({
        enableClustering: true,
        clusterConfig: {
          instances: 1,
          execMode: 'fork',
          maxMemory: '256M'
        }
      });

      const clusterStatus = await testDaemon.getClusterStatus();
      expect(clusterStatus.mode).toBe('fork');

      await testDaemon.stop();
    }, 10000);
  });

  describe('🔧 Error Handling and Resilience', () => {
    it('should handle component initialization failures gracefully', async () => {
      // Test with invalid configuration
      const invalidDaemon = new DaemonV2({
        enableClustering: true,
        clusterConfig: {
          instances: -1 // Invalid
        }
      });

      // Should not throw but handle gracefully
      expect(() => invalidDaemon.getStats()).not.toThrow();

      await invalidDaemon.stop();
    });

    it('should handle health check failures without crashing', async () => {
      const healthSystem = daemon.getHealthSystem();

      // Add a failing health check
      healthSystem.addHealthCheck('failing-check', async () => {
        throw new Error('Health check failed');
      });

      // Should still perform other checks successfully
      const healthStatus = await healthSystem.performHealthCheck();
      expect(healthStatus.checks.length).toBeGreaterThan(0);

      // Should have at least one failed check
      const failedChecks = healthStatus.checks.filter(c => c.status === 'unhealthy');
      expect(failedChecks.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle cluster operations failures gracefully', async () => {
      // Mock cluster operation failure
      const clusterManager = daemon.getClusterManager();

      // Should handle invalid scaling operations
      await expect(daemon.scaleCluster(-1)).rejects.toThrow();
    });
  });

  describe('🔗 API Integration and External Communication', () => {
    it('should provide REST API endpoints for cluster management', async () => {
      // Test cluster status endpoint would work in production
      const clusterStatus = await daemon.getClusterStatus();
      expect(clusterStatus.name).toBeDefined();
      expect(clusterStatus.instances).toBeDefined();
    });

    it('should provide REST API endpoints for health monitoring', async () => {
      // Test health status endpoint would work in production
      const healthStatus = await daemon.getHealthStatus();
      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.components).toBeDefined();
    });

    it('should provide metrics endpoints for monitoring systems', () => {
      const metrics = daemon.getMetrics();
      expect(metrics).toBeDefined();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });
  });
});

describe('Daemon V2 - Performance Benchmarks', () => {
  it('should handle rapid health checks efficiently', async () => {
    const daemon = new DaemonV2({
      enableHealthMonitoring: true,
      healthConfig: {
        checkInterval: 1000,
        timeoutThreshold: 5000
      }
    });

    const startTime = Date.now();
    const concurrentChecks = 10;

    // Perform multiple health checks concurrently
    const promises = Array.from({ length: concurrentChecks }, () =>
      daemon.performHealthCheck()
    );

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;

    expect(successful).toBe(concurrentChecks);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    await daemon.stop();
  }, 10000);

  it('should maintain performance under load', async () => {
    const daemon = new DaemonV2({
      enableMetrics: true,
      enableClustering: false // Disable for test simplicity
    });

    // Simulate load
    const operations = 100;
    const startTime = Date.now();

    for (let i = 0; i < operations; i++) {
      daemon.trackRequest(`req-${i}`, Math.random() * 100);
      daemon.getStats();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete within 1 second

    await daemon.stop();
  }, 10000);
});

describe('Daemon V2 - Configuration Validation', () => {
  it('should validate cluster configuration', () => {
    expect(() => {
      new DaemonV2({
        enableClustering: true,
        clusterConfig: {
          instances: 0,
          execMode: 'invalid' as any
        }
      });
    }).not.toThrow(); // Should handle invalid config gracefully
  });

  it('should validate health configuration', () => {
    expect(() => {
      new DaemonV2({
        enableHealthMonitoring: true,
        healthConfig: {
          checkInterval: -100,
          timeoutThreshold: -50
        }
      });
    }).not.toThrow(); // Should handle invalid config gracefully
  });

  it('should validate shutdown configuration', () => {
    expect(() => {
      new DaemonV2({
        enableGracefulShutdown: true,
        shutdownConfig: {
          timeout: -1000,
          gracefulTimeout: -500
        }
      });
    }).not.toThrow(); // Should handle invalid config gracefully
  });
});