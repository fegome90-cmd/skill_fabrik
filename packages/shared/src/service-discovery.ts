/**
 * Service Discovery
 *
 * High-level service discovery API with caching and load balancing
 */

import { ServiceRegistry, ServiceInfo, ServiceQuery, ServiceRegistration } from './service-registry.js';
import { HealthChecker } from './health-checker.js';

export interface ServiceDiscoveryConfig {
  registry: {
    enabled: boolean;
    port: number;
    host: string;
  };
  cache: {
    enabled: boolean;
    ttl: number; // Cache TTL in seconds
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round-robin' | 'random' | 'health-based';
  };
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface ServiceEndpoint {
  name: string;
  url: string;
  host: string;
  port: number;
  version: string;
  healthy: boolean;
  lastChecked: Date;
  responseTime?: number;
}

export interface ServiceCache {
  services: Map<string, { endpoints: ServiceEndpoint[]; cachedAt: Date; ttl: number }>;
  discovery: Map<string, { service: ServiceInfo; cachedAt: Date; ttl: number }>;
}

export class ServiceDiscovery {
  private registry: ServiceRegistry;
  private healthChecker: HealthChecker;
  private config: ServiceDiscoveryConfig;
  private cache: ServiceCache;
  private loadBalancingCounters: Map<string, number> = new Map();

  constructor(config: Partial<ServiceDiscoveryConfig> = {}) {
    this.config = {
      registry: {
        enabled: true,
        port: 8877, // Discovery service port
        host: '127.0.0.1'
      },
      cache: {
        enabled: true,
        ttl: 30 // 30 seconds cache TTL
      },
      loadBalancing: {
        enabled: true,
        strategy: 'round-robin'
      },
      healthCheck: {
        enabled: true,
        interval: 10000, // 10 seconds
        timeout: 5000,
        retries: 3
      },
      ...config
    };

    this.registry = new ServiceRegistry();
    this.healthChecker = new HealthChecker({
      timeout: this.config.healthCheck.timeout,
      retries: this.config.healthCheck.retries
    });

    this.cache = {
      services: new Map(),
      discovery: new Map()
    };

    this.startHealthMonitoring();
  }

  /**
   * Register a service with the discovery system
   */
  async registerService(registration: ServiceRegistration): Promise<void> {
    await this.registry.registerService(registration);

    // Clear cache for this service
    this.clearCache(registration.service.name);

    console.log(`🎯 Service registered with discovery: ${registration.service.name}`);
  }

  /**
   * Deregister a service from the discovery system
   */
  async deregisterService(serviceName: string): Promise<void> {
    await this.registry.deregisterService(serviceName);

    // Clear cache
    this.clearCache(serviceName);

    console.log(`📤 Service deregistered from discovery: ${serviceName}`);
  }

  /**
   * Discover a service by name with caching
   */
  async discoverService(serviceName: string): Promise<ServiceInfo | null> {
    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.discovery.get(serviceName);
      if (cached && this.isCacheValid(cached.cachedAt, cached.ttl)) {
        return cached.service;
      }
    }

    // Discover from registry
    const service = await this.registry.discoverService(serviceName);

    // Update cache
    if (service && this.config.cache.enabled) {
      this.cache.discovery.set(serviceName, {
        service,
        cachedAt: new Date(),
        ttl: this.config.cache.ttl
      });
    }

    return service;
  }

  /**
   * Get service endpoints with load balancing
   */
  async getServiceEndpoints(serviceName: string): Promise<ServiceEndpoint[]> {
    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.services.get(serviceName);
      if (cached && this.isCacheValid(cached.cachedAt, cached.ttl)) {
        return cached.endpoints;
      }
    }

    // Get services from registry
    const services = await this.registry.queryServices({
      name: serviceName,
      healthyOnly: true
    });

    const endpoints: ServiceEndpoint[] = services.map(service => ({
      name: service.name,
      url: `http://${service.host}:${service.port}`,
      host: service.host,
      port: service.port,
      version: service.version,
      healthy: service.status === 'healthy',
      lastChecked: service.lastSeen,
      responseTime: undefined
    }));

    // Update cache
    if (this.config.cache.enabled) {
      this.cache.services.set(serviceName, {
        endpoints,
        cachedAt: new Date(),
        ttl: this.config.cache.ttl
      });
    }

    return endpoints;
  }

  /**
   * Get a single service endpoint using load balancing
   */
  async getServiceEndpoint(serviceName: string): Promise<ServiceEndpoint | null> {
    const endpoints = await this.getServiceEndpoints(serviceName);

    if (endpoints.length === 0) {
      return null;
    }

    if (!this.config.loadBalancing.enabled) {
      return endpoints[0];
    }

    return this.selectEndpoint(serviceName, endpoints);
  }

  /**
   * Select an endpoint based on load balancing strategy
   */
  private selectEndpoint(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const strategy = this.config.loadBalancing.strategy;

    switch (strategy) {
      case 'random':
        return endpoints[Math.floor(Math.random() * endpoints.length)];

      case 'round-robin':
        const current = this.loadBalancingCounters.get(serviceName) || 0;
        const selected = endpoints[current % endpoints.length];
        this.loadBalancingCounters.set(serviceName, current + 1);
        return selected;

      case 'health-based':
        // Select endpoint with best health (prefer fastest response time)
        return endpoints.sort((a, b) => {
          if (a.responseTime && b.responseTime) {
            return a.responseTime - b.responseTime;
          }
          return a.healthy === b.healthy ? 0 : a.healthy ? -1 : 1;
        })[0];

      default:
        return endpoints[0];
    }
  }

  /**
   * Query services with advanced filtering
   */
  async queryServices(query: ServiceQuery): Promise<ServiceInfo[]> {
    return await this.registry.queryServices(query);
  }

  /**
   * Get all healthy services
   */
  async getHealthyServices(): Promise<ServiceInfo[]> {
    return await this.registry.queryServices({
      healthyOnly: true
    });
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = await this.discoverService(serviceName);
    if (!service) {
      return false;
    }

    const healthUrl = `http://${service.host}:${service.port}${service.healthEndpoint}`;
    return await this.healthChecker.isHealthy(healthUrl);
  }

  /**
   * Get service statistics
   */
  async getServiceStats(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    services: Array<{
      name: string;
      status: string;
      endpoints: number;
      avgResponseTime?: number;
    }>;
  }> {
    const stats = await this.registry.getStats();
    const serviceStats = [];

    for (const serviceStat of stats.services) {
      const endpoints = await this.getServiceEndpoints(serviceStat.name);
      const avgResponseTime = endpoints
        .filter(e => e.responseTime)
        .reduce((sum, e) => sum + (e.responseTime || 0), 0) / endpoints.length;

      serviceStats.push({
        name: serviceStat.name,
        status: serviceStat.status,
        endpoints: endpoints.length,
        avgResponseTime: avgResponseTime || undefined
      });
    }

    return {
      total: stats.total,
      healthy: stats.healthy,
      unhealthy: stats.unhealthy,
      services: serviceStats
    };
  }

  /**
   * Refresh service registration (heartbeat)
   */
  async refreshService(serviceName: string): Promise<boolean> {
    const success = await this.registry.refreshService(serviceName);

    if (success) {
      // Clear cache to force refresh
      this.clearCache(serviceName);
    }

    return success;
  }

  /**
   * Clear cache for a specific service
   */
  private clearCache(serviceName: string): void {
    this.cache.services.delete(serviceName);
    this.cache.discovery.delete(serviceName);
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cachedAt: Date, ttl: number): boolean {
    const now = Date.now();
    const age = (now - cachedAt.getTime()) / 1000; // Convert to seconds
    return age < ttl;
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    if (!this.config.healthCheck.enabled) {
      return;
    }

    setInterval(async () => {
      try {
        const services = await this.registry.getAllServices();

        for (const service of services) {
          const healthUrl = `http://${service.host}:${service.port}${service.healthEndpoint}`;

          try {
            const startTime = Date.now();
            const isHealthy = await this.healthChecker.isHealthy(healthUrl);
            const responseTime = Date.now() - startTime;

            await this.registry.updateServiceHealth(
              service.name,
              isHealthy ? 'healthy' : 'unhealthy'
            );

            // Update cache with response time
            const cachedEndpoints = this.cache.services.get(service.name);
            if (cachedEndpoints) {
              cachedEndpoints.endpoints.forEach(endpoint => {
                if (endpoint.name === service.name) {
                  endpoint.healthy = isHealthy;
                  endpoint.responseTime = responseTime;
                  endpoint.lastChecked = new Date();
                }
              });
            }

          } catch (error) {
            await this.registry.updateServiceHealth(service.name, 'unhealthy');
          }
        }

        // Clean up expired cache entries
        this.cleanupCache();

      } catch (error) {
        console.error('❌ Health monitoring error:', error);
      }
    }, this.config.healthCheck.interval);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();

    // Cleanup service cache
    for (const [serviceName, cached] of this.cache.services) {
      const age = (now - cached.cachedAt.getTime()) / 1000;
      if (age > cached.ttl * 2) { // 2x TTL before cleanup
        this.cache.services.delete(serviceName);
      }
    }

    // Cleanup discovery cache
    for (const [serviceName, cached] of this.cache.discovery) {
      const age = (now - cached.cachedAt.getTime()) / 1000;
      if (age > cached.ttl * 2) { // 2x TTL before cleanup
        this.cache.discovery.delete(serviceName);
      }
    }
  }

  /**
   * Get registry instance for advanced operations
   */
  getRegistry(): ServiceRegistry {
    return this.registry;
  }

  /**
   * Get current configuration
   */
  getConfig(): ServiceDiscoveryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ServiceDiscoveryConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Shutdown the discovery system
   */
  destroy(): void {
    this.registry.destroy();
    this.cache.services.clear();
    this.cache.discovery.clear();
    this.loadBalancingCounters.clear();
    console.log('🔌 Service discovery shut down');
  }
}