/**
 * Service Registry
 *
 * Central registry for managing service information, health status, and discovery
 */

export interface ServiceInfo {
  name: string;
  host: string;
  port: number;
  version: string;
  healthEndpoint: string;
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped' | 'unknown';
  lastSeen: Date;
  registeredAt: Date;
  metadata?: ServiceMetadata;
}

export interface ServiceMetadata {
  description?: string;
  tags?: string[];
  dependencies?: string[];
  environment?: string;
  region?: string;
  namespace?: string;
  owner?: string;
  contact?: string;
  buildInfo?: {
    version: string;
    commit: string;
    builtAt: string;
  };
}

export interface ServiceRegistration {
  service: ServiceInfo;
  ttl?: number; // Time to live in seconds
}

export interface ServiceQuery {
  name?: string;
  tags?: string[];
  status?: ServiceInfo['status'];
  environment?: string;
  namespace?: string;
  healthyOnly?: boolean;
}

export interface RegistryConfig {
  ttl: number; // Default TTL in seconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  healthCheckInterval: number; // Health check interval in milliseconds
  enablePersistence: boolean;
  storagePath?: string;
}

export class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private config: RegistryConfig;

  constructor(config: Partial<RegistryConfig> = {}) {
    this.config = {
      ttl: 60, // 60 seconds default TTL
      cleanupInterval: 30000, // 30 seconds
      healthCheckInterval: 10000, // 10 seconds
      enablePersistence: false,
      ...config
    };

    this.startCleanupTimer();
    this.startHealthCheckTimer();
  }

  /**
   * Register a new service
   */
  async registerService(registration: ServiceRegistration): Promise<void> {
    const { service, ttl } = registration;

    // Update service with current timestamp
    const serviceInfo: ServiceInfo = {
      ...service,
      lastSeen: new Date(),
      registeredAt: service.registeredAt || new Date()
    };

    this.services.set(service.name, serviceInfo);

    // Set TTL if provided
    if (ttl && ttl > 0) {
      setTimeout(() => {
        this.expireService(service.name);
      }, ttl * 1000);
    }

    console.log(`📝 Service registered: ${service.name} (${service.host}:${service.port})`);
  }

  /**
   * Deregister a service
   */
  async deregisterService(serviceName: string): Promise<void> {
    if (this.services.delete(serviceName)) {
      console.log(`🗑️  Service deregistered: ${serviceName}`);
    }
  }

  /**
   * Update service health status
   */
  async updateServiceHealth(serviceName: string, status: ServiceInfo['status']): Promise<void> {
    const service = this.services.get(serviceName);
    if (service) {
      service.status = status;
      service.lastSeen = new Date();
      this.services.set(serviceName, service);
    }
  }

  /**
   * Discover a specific service by name
   */
  async discoverService(serviceName: string): Promise<ServiceInfo | null> {
    const service = this.services.get(serviceName);

    if (service && this.isServiceAlive(service)) {
      return service;
    }

    return null;
  }

  /**
   * Query services based on criteria
   */
  async queryServices(query: ServiceQuery): Promise<ServiceInfo[]> {
    let services = Array.from(this.services.values());

    // Filter by name
    if (query.name) {
      services = services.filter(s => s.name === query.name);
    }

    // Filter by status
    if (query.status) {
      services = services.filter(s => s.status === query.status);
    }

    // Filter by environment
    if (query.environment) {
      services = services.filter(s => s.metadata?.environment === query.environment);
    }

    // Filter by namespace
    if (query.namespace) {
      services = services.filter(s => s.metadata?.namespace === query.namespace);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      services = services.filter(s =>
        query.tags!.some(tag => s.metadata?.tags?.includes(tag))
      );
    }

    // Filter healthy only
    if (query.healthyOnly) {
      services = services.filter(s => s.status === 'healthy');
    }

    // Filter only alive services
    services = services.filter(s => this.isServiceAlive(s));

    return services;
  }

  /**
   * Get all registered services
   */
  async getAllServices(): Promise<ServiceInfo[]> {
    return Array.from(this.services.values()).filter(s => this.isServiceAlive(s));
  }

  /**
   * Get service by name with detailed information
   */
  async getServiceDetails(serviceName: string): Promise<ServiceInfo | null> {
    const service = this.services.get(serviceName);

    if (service && this.isServiceAlive(service)) {
      return {
        ...service,
        uptime: Date.now() - service.registeredAt.getTime(),
        timeSinceLastCheck: Date.now() - service.lastSeen.getTime()
      } as ServiceInfo & { uptime: number; timeSinceLastCheck: number };
    }

    return null;
  }

  /**
   * Refresh service registration (heartbeat)
   */
  async refreshService(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);

    if (service) {
      service.lastSeen = new Date();
      this.services.set(serviceName, service);
      return true;
    }

    return false;
  }

  /**
   * Get registry statistics
   */
  async getStats(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    starting: number;
    stopped: number;
    unknown: number;
    services: Array<{ name: string; status: string; uptime: number }>;
  }> {
    const services = Array.from(this.services.values()).filter(s => this.isServiceAlive(s));

    const stats = {
      total: services.length,
      healthy: 0,
      unhealthy: 0,
      starting: 0,
      stopped: 0,
      unknown: 0,
      services: services.map(s => ({
        name: s.name,
        status: s.status,
        uptime: Date.now() - s.registeredAt.getTime()
      }))
    };

    services.forEach(s => {
      stats[s.status]++;
    });

    return stats;
  }

  /**
   * Check if service is still alive based on TTL
   */
  private isServiceAlive(service: ServiceInfo): boolean {
    const now = Date.now();
    const timeSinceLastSeen = now - service.lastSeen.getTime();
    return timeSinceLastSeen < (this.config.ttl * 1000);
  }

  /**
   * Expire a service (mark as stopped)
   */
  private expireService(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (service) {
      service.status = 'stopped';
      this.services.set(serviceName, service);
      console.log(`⏰ Service expired: ${serviceName}`);
    }
  }

  /**
   * Cleanup expired services
   */
  private cleanupExpiredServices(): void {
    const now = Date.now();
    const expiredServices: string[] = [];

    for (const [name, service] of this.services) {
      const timeSinceLastSeen = now - service.lastSeen.getTime();
      if (timeSinceLastSeen > (this.config.ttl * 1000 * 2)) { // 2x TTL before removal
        expiredServices.push(name);
      }
    }

    expiredServices.forEach(name => {
      this.services.delete(name);
      console.log(`🧹 Service removed (expired): ${name}`);
    });

    if (expiredServices.length > 0) {
      console.log(`🧹 Cleanup completed: removed ${expiredServices.length} expired services`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredServices();
    }, this.config.cleanupInterval);
  }

  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const services = Array.from(this.services.values());

    for (const service of services) {
      try {
        if (!this.isServiceAlive(service)) {
          service.status = 'stopped';
          continue;
        }

        // Perform HTTP health check
        const response = await fetch(
          `http://${service.host}:${service.port}${service.healthEndpoint}`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          }
        );

        if (response.ok) {
          if (service.status === 'starting') {
            console.log(`✅ Service started: ${service.name}`);
          }
          service.status = 'healthy';
        } else {
          service.status = 'unhealthy';
        }

        service.lastSeen = new Date();
        this.services.set(service.name, service);

      } catch (error) {
        service.status = 'unhealthy';
        this.services.set(service.name, service);
      }
    }
  }

  /**
   * Shutdown the registry
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.services.clear();
    console.log('🔌 Service registry shut down');
  }
}