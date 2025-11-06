/**
 * Service Dependency Manager
 *
 * Manages service startup ordering, health checks, and dependency resolution
 */

export interface ServiceDependency {
  name: string;
  host: string;
  port: number;
  healthEndpoint: string;
  dependencies: string[];
  startupOrder: number;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface ServiceStatus {
  name: string;
  status: 'pending' | 'starting' | 'healthy' | 'unhealthy' | 'stopped' | 'failed';
  uptime: number;
  lastHealthCheck: Date;
  healthCheckCount: number;
  healthCheckFailures: number;
  dependencies: string[];
  startedAt?: Date;
}

export interface DependencyGraph {
  nodes: Map<string, ServiceDependency>;
  resolved: boolean;
  startupOrder: string[];
}

export class ServiceDependencyManager {
  private services: Map<string, ServiceDependency> = new Map();
  private status: Map<string, ServiceStatus> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Array<(event: string, data: any) => void> = [];

  constructor(private config: { defaultTimeout?: number; defaultInterval?: number } = {}) {
    this.config = {
      defaultTimeout: 30000,
      defaultInterval: 5000,
      ...config
    };
  }

  /**
   * Register a service with its dependencies
   */
  registerService(service: ServiceDependency): void {
    this.services.set(service.name, service);
    this.status.set(service.name, {
      name: service.name,
      status: 'pending',
      uptime: 0,
      lastHealthCheck: new Date(),
      healthCheckCount: 0,
      healthCheckFailures: 0,
      dependencies: service.dependencies
    });

    this.emit('service-registered', { service });
  }

  /**
   * Build dependency graph and validate for circular dependencies
   */
  buildDependencyGraph(): DependencyGraph {
    const graph = new Map<string, ServiceDependency>();
    const inDegree = new Map<string, number>();
    const startupOrder: string[] = [];

    // Initialize in-degree counts
    for (const [name, service] of this.services) {
      graph.set(name, service);
      inDegree.set(name, 0);
    }

    // Calculate in-degrees
    for (const service of this.services.values()) {
      for (const dep of service.dependencies) {
        if (!this.services.has(dep)) {
          throw new Error(`Dependency '${dep}' for service '${service.name}' is not registered`);
        }
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Topological sort for startup order
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      startupOrder.push(current);

      const currentService = this.services.get(current);
      if (currentService) {
        for (const dep of currentService.dependencies) {
          const newDegree = (inDegree.get(dep) || 0) - 1;
          inDegree.set(dep, newDegree);
          if (newDegree === 0) {
            queue.push(dep);
          }
        }
      }
    }

    // Check for circular dependencies
    if (startupOrder.length !== this.services.size) {
      const remaining = Array.from(this.services.keys()).filter(
        name => !startupOrder.includes(name)
      );
      throw new Error(`Circular dependency detected among services: ${remaining.join(', ')}`);
    }

    return {
      nodes: graph,
      resolved: true,
      startupOrder
    };
  }

  /**
   * Start all services in dependency order
   */
  async startAllServices(env: string = 'development'): Promise<void> {
    this.emit('startup-started', { env });

    try {
      const graph = this.buildDependencyGraph();

      // Start services in dependency order
      for (const serviceName of graph.startupOrder) {
        await this.startService(serviceName, env);
      }

      this.emit('startup-completed', { order: graph.startupOrder });
    } catch (error) {
      this.emit('startup-failed', { error });
      throw error;
    }
  }

  /**
   * Start a single service
   */
  async startService(serviceName: string, env: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' is not registered`);
    }

    const status = this.status.get(serviceName)!;
    status.status = 'starting';
    status.startedAt = new Date();
    this.emit('service-starting', { service: serviceName });

    // Wait for dependencies to be healthy
    for (const depName of service.dependencies) {
      await this.waitForService(depName, 'healthy');
    }

    // Start the service via PM2
    try {
      await this.startServiceViaPM2(serviceName, env);

      // Wait for service to be healthy
      await this.waitForService(serviceName, 'healthy');

      // Start health monitoring
      this.startHealthMonitoring(serviceName);

      status.status = 'healthy';
      this.emit('service-started', { service: serviceName });

    } catch (error) {
      status.status = 'failed';
      this.emit('service-failed', { service: serviceName, error });
      throw error;
    }
  }

  /**
   * Stop all services in reverse dependency order
   */
  async stopAllServices(): Promise<void> {
    const graph = this.buildDependencyGraph();

    // Stop services in reverse dependency order
    for (const serviceName of graph.startupOrder.reverse()) {
      await this.stopService(serviceName);
    }
  }

  /**
   * Stop a single service
   */
  async stopService(serviceName: string): Promise<void> {
    this.stopHealthMonitoring(serviceName);

    try {
      await this.stopServiceViaPM2(serviceName);

      const status = this.status.get(serviceName)!;
      status.status = 'stopped';
      this.emit('service-stopped', { service: serviceName });

    } catch (error) {
      console.error(`Failed to stop service ${serviceName}:`, error);
    }
  }

  /**
   * Get status of all services
   */
  getAllStatus(): Map<string, ServiceStatus> {
    return new Map(this.status);
  }

  /**
   * Get status of a specific service
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.status.get(serviceName);
  }

  /**
   * Wait for a service to reach a specific status
   */
  async waitForService(serviceName: string, targetStatus: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' is not registered`);
    }

    const maxWaitTime = service.timeout || this.config.defaultTimeout || 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = this.status.get(serviceName);
      if (status && status.status === targetStatus) {
        return;
      }
      await this.sleep(1000);
    }

    throw new Error(`Service '${serviceName}' did not reach status '${targetStatus}' within ${maxWaitTime}ms`);
  }

  /**
   * Perform health check on a service
   */
  async performHealthCheck(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    const status = this.status.get(serviceName);

    if (!service || !status) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), service.timeout || this.config.defaultTimeout || 30000);

      const response = await fetch(`http://${service.host}:${service.port}${service.healthEndpoint}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeout);

      const isHealthy = response.ok;
      status.lastHealthCheck = new Date();
      status.healthCheckCount++;

      if (isHealthy) {
        status.healthCheckFailures = 0;
        if (status.status !== 'healthy') {
          status.status = 'healthy';
          this.emit('service-recovered', { service: serviceName });
        }
      } else {
        status.healthCheckFailures++;
        if (status.healthCheckFailures >= 3 && status.status === 'healthy') {
          status.status = 'unhealthy';
          this.emit('service-unhealthy', { service: serviceName });
        }
      }

      return isHealthy;
    } catch (error) {
      status.lastHealthCheck = new Date();
      status.healthCheckCount++;
      status.healthCheckFailures++;

      if (status.healthCheckFailures >= 3 && status.status === 'healthy') {
        status.status = 'unhealthy';
        this.emit('service-unhealthy', { service: serviceName, error });
      }

      return false;
    }
  }

  /**
   * Start health monitoring for a service
   */
  private startHealthMonitoring(serviceName: string): void {
    this.stopHealthMonitoring(serviceName); // Clear existing interval

    const service = this.services.get(serviceName);
    if (!service) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceName);
    }, service.healthCheckInterval || this.config.defaultInterval);

    this.healthCheckIntervals.set(serviceName, interval);
  }

  /**
   * Stop health monitoring for a service
   */
  private stopHealthMonitoring(serviceName: string): void {
    const interval = this.healthCheckIntervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceName);
    }
  }

  /**
   * Start service via PM2
   */
  private async startServiceViaPM2(serviceName: string, env: string): Promise<void> {
    const { execSync } = await import('child_process');
    execSync(`pm2 start scripts/pm2/ecosystem.config.cjs --only ${serviceName} --env ${env}`, {
      stdio: 'pipe',
      cwd: process.cwd()
    });
  }

  /**
   * Stop service via PM2
   */
  private async stopServiceViaPM2(serviceName: string): Promise<void> {
    const { execSync } = await import('child_process');
    execSync(`pm2 stop ${serviceName}`, {
      stdio: 'pipe',
      cwd: process.cwd()
    });
  }

  /**
   * Event emitter functionality
   */
  private emit(event: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  on(event: string, listener: (event: string, data: any) => void): void {
    this.listeners.push(listener);
  }

  off(event: string, listener: (event: string, data: any) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
    this.listeners = [];
    this.services.clear();
    this.status.clear();
  }
}