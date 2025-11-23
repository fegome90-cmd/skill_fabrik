/**
 * Load Balancer for Skills Activation
 * Distributes load across multiple daemon instances
 * Task: SF-SCALABILITY-2025-T2.1
 * Date: 2025-11-14
 */

import { logger } from '../logger.js';
import { DaemonHealthChecker, type HealthStatus } from '../health-checker.js';

export interface DaemonInstance {
  id: string;
  url: string;
  weight: number;
  healthChecker: DaemonHealthChecker;
  currentConnections: number;
  maxConnections: number;
  lastUsed: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

export interface LoadBalancerOptions {
  daemonInstances: Array<{
    id: string;
    url: string;
    weight?: number;
    maxConnections?: number;
  }>;
  healthCheckInterval?: number;
  maxFailures?: number;
  strategy?: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 'response-time';
  circuitBreakerThreshold?: number;
}

export interface LoadBalancerStats {
  totalInstances: number;
  healthyInstances: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  currentConnections: number;
  healthCheckInterval: number;
  strategy: string;
  uptimePercentage: number;
}

/**
 * Advanced Load Balancer with multiple strategies
 */
export class LoadBalancer {
  private instances: Map<string, DaemonInstance> = new Map();
  private strategy: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 'response-time';
  private currentIndex = 0;
  private stats = {
    totalRequests: 0,
    failedRequests: 0,
    startTime: Date.now(),
    lastHealthCheck: 0
  };
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private circuitBreakerThreshold: number;
  private maxFailures: number;

  constructor(options: LoadBalancerOptions) {
    this.strategy = options.strategy || 'weighted-round-robin';
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.maxFailures = options.maxFailures || 3;

    // Initialize daemon instances
    for (const instanceConfig of options.daemonInstances) {
      const instance: DaemonInstance = {
        id: instanceConfig.id,
        url: instanceConfig.url,
        weight: instanceConfig.weight || 1,
        healthChecker: new DaemonHealthChecker(
          instanceConfig.url,
          options.healthCheckInterval || 30000
        ),
        currentConnections: 0,
        maxConnections: instanceConfig.maxConnections || 100,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      };

      this.instances.set(instance.id, instance);
      instance.healthChecker.start();
    }

    // Start health monitoring
    this.startHealthMonitoring();

    logger.info({
      instances: options.daemonInstances.length,
      strategy: this.strategy,
      healthCheckInterval: options.healthCheckInterval
    }, 'Load balancer initialized');
  }

  /**
   * Get the best daemon instance for the request
   */
  public selectInstance(): DaemonInstance | null {
    const healthyInstances = Array.from(this.instances.values())
      .filter(instance => instance.healthChecker.isHealthy())
      .filter(instance => this.isInstanceAvailable(instance));

    if (healthyInstances.length === 0) {
      logger.error('No healthy daemon instances available');
      return null;
    }

    let selectedInstance: DaemonInstance;

    switch (this.strategy) {
      case 'round-robin':
        selectedInstance = this.selectRoundRobin(healthyInstances);
        break;
      case 'weighted-round-robin':
        selectedInstance = this.selectWeightedRoundRobin(healthyInstances);
        break;
      case 'least-connections':
        selectedInstance = this.selectLeastConnections(healthyInstances);
        break;
      case 'response-time':
        selectedInstance = this.selectByResponseTime(healthyInstances);
        break;
      default:
        selectedInstance = healthyInstances[0];
    }

    // Update instance metrics
    selectedInstance.currentConnections++;
    selectedInstance.lastUsed = Date.now();
    selectedInstance.totalRequests++;
    this.stats.totalRequests++;

    logger.debug({
      instanceId: selectedInstance.id,
      url: selectedInstance.url,
      strategy: this.strategy,
      currentConnections: selectedInstance.currentConnections
    }, 'Selected daemon instance');

    return selectedInstance;
  }

  /**
   * Release connection after request completion
   */
  public releaseInstance(instanceId: string, responseTime: number, success: boolean): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.currentConnections = Math.max(0, instance.currentConnections - 1);

    // Update average response time
    const totalRequests = instance.totalRequests;
    const currentAvg = instance.averageResponseTime;
    instance.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

    if (!success) {
      instance.failedRequests++;
      this.stats.failedRequests++;
    }

    logger.debug({
      instanceId,
      responseTime,
      success,
      currentConnections: instance.currentConnections,
      averageResponseTime: instance.averageResponseTime
    }, 'Released daemon instance');
  }

  /**
   * Get load balancer statistics
   */
  public getStats(): LoadBalancerStats {
    const instances = Array.from(this.instances.values());
    const healthyCount = instances.filter(i => i.healthChecker.isHealthy()).length;
    const uptime = Date.now() - this.stats.startTime;
    const uptimePercentage = (uptime / 1000) > 0 ? (1 - (this.stats.failedRequests / Math.max(1, this.stats.totalRequests))) * 100 : 100;

    return {
      totalInstances: instances.length,
      healthyInstances: healthyCount,
      totalRequests: this.stats.totalRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime: instances.reduce((sum, i) => sum + i.averageResponseTime, 0) / instances.length,
      currentConnections: instances.reduce((sum, i) => sum + i.currentConnections, 0),
      healthCheckInterval: this.healthCheckInterval ? 30000 : 0,
      strategy: this.strategy,
      uptimePercentage
    };
  }

  /**
   * Get detailed instance status
   */
  public getInstanceStatus(): Array<InstanceStatus> {
    return Array.from(this.instances.values()).map(instance => ({
      id: instance.id,
      url: instance.url,
      healthy: instance.healthChecker.isHealthy(),
      healthStatus: instance.healthChecker.getStatus(),
      currentConnections: instance.currentConnections,
      maxConnections: instance.maxConnections,
      totalRequests: instance.totalRequests,
      failedRequests: instance.failedRequests,
      averageResponseTime: instance.averageResponseTime,
      weight: instance.weight,
      lastUsed: instance.lastUsed,
      successRate: instance.totalRequests > 0
        ? ((instance.totalRequests - instance.failedRequests) / instance.totalRequests) * 100
        : 0
    }));
  }

  /**
   * Update load balancing strategy
   */
  public updateStrategy(strategy: typeof this.strategy): void {
    this.strategy = strategy;
    logger.info({ strategy }, 'Load balancing strategy updated');
  }

  /**
   * Add new daemon instance
   */
  public addInstance(config: LoadBalancerOptions['daemonInstances'][0]): void {
    if (this.instances.has(config.id)) {
      logger.warn({ instanceId: config.id }, 'Instance already exists');
      return;
    }

    const instance: DaemonInstance = {
      id: config.id,
      url: config.url,
      weight: config.weight || 1,
      healthChecker: new DaemonHealthChecker(config.url, 30000),
      currentConnections: 0,
      maxConnections: config.maxConnections || 100,
      lastUsed: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    this.instances.set(config.id, instance);
    instance.healthChecker.start();

    logger.info({ instanceId: config.id, url: config.url }, 'Added new daemon instance');
  }

  /**
   * Remove daemon instance
   */
  public removeInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.healthChecker.stop();
      this.instances.delete(instanceId);
      logger.info({ instanceId }, 'Removed daemon instance');
    }
  }

  /**
   * Shutdown load balancer
   */
  public shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    for (const instance of this.instances.values()) {
      instance.healthChecker.stop();
    }

    logger.info('Load balancer shutdown completed');
  }

  // Private methods

  private selectRoundRobin(instances: DaemonInstance[]): DaemonInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex++;
    return instance;
  }

  private selectWeightedRoundRobin(instances: DaemonInstance[]): DaemonInstance {
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[0];
  }

  private selectLeastConnections(instances: DaemonInstance[]): DaemonInstance {
    return instances.reduce((min, current) =>
      current.currentConnections < min.currentConnections ? current : min
    );
  }

  private selectByResponseTime(instances: DaemonInstance[]): DaemonInstance {
    return instances.reduce((best, current) => {
      // Prefer instances with better response time and fewer failures
      const bestScore = best.averageResponseTime / (1 + best.failedRequests);
      const currentScore = current.averageResponseTime / (1 + current.failedRequests);
      return currentScore < bestScore ? current : best;
    });
  }

  private isInstanceAvailable(instance: DaemonInstance): boolean {
    // Check if instance has exceeded circuit breaker threshold
    const failureRate = instance.totalRequests > 0
      ? instance.failedRequests / instance.totalRequests
      : 0;

    if (failureRate > 0.5 && instance.failedRequests >= this.circuitBreakerThreshold) {
      return false;
    }

    // Check connection limits
    if (instance.currentConnections >= instance.maxConnections) {
      return false;
    }

    return true;
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.stats.lastHealthCheck = Date.now();
      this.performHealthCheck();
    }, 60000); // Every minute

    if (this.healthCheckInterval.unref) {
      this.healthCheckInterval.unref();
    }
  }

  private performHealthCheck(): void {
    const instances = Array.from(this.instances.values());
    const healthyCount = instances.filter(i => i.healthChecker.isHealthy()).length;

    if (healthyCount === 0) {
      logger.error('All daemon instances are unhealthy!');
    } else if (healthyCount < instances.length) {
      logger.warn({
        healthy: healthyCount,
        total: instances.length
      }, 'Some daemon instances are unhealthy');
    }
  }
}

interface InstanceStatus {
  id: string;
  url: string;
  healthy: boolean;
  healthStatus: HealthStatus;
  currentConnections: number;
  maxConnections: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  weight: number;
  lastUsed: number;
  successRate: number;
}