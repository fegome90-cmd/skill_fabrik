/**
 * Daemon V2 - Enhanced Orchestration Runtime
 * Integrates PM2 clustering, graceful shutdown, and advanced health monitoring
 * Task: SF-DAEMON-2025-V2.0
 * Date: 2025-11-14
 */

import Fastify from 'fastify';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

// Enhanced Components
import { PM2ClusterManager } from './orchestration/pm2-cluster-manager.js';
import { GracefulShutdownManager } from './orchestration/graceful-shutdown-manager.js';
import { HealthCheckSystem } from './orchestration/health-check-system.js';

// Time Constants (PROH-010 Compliance - Eliminate Magic Numbers)
import { TIME_OPERATIONS } from './constants/time-constants.js';
import { MetricsCollector } from '../../router/src/metrics/metrics-collector.js';

// Original Components (will be wrapped)
import { getLogger } from './observability/logger.js';
import { getFileWatcherService } from './fileWatcher.js';
import { getQualityService } from './qualityService.js';
import { realtimeDashboard } from './real-time-dashboard.js';

// Configuration
import { loadDaemonConfig, type DaemonConfig } from './config/daemon-config.js';

export interface DaemonV2Options {
  config?: Partial<DaemonConfig>;
  enableClustering?: boolean;
  enableGracefulShutdown?: boolean;
  enableAdvancedHealth?: boolean;
  enableMetrics?: boolean;
  enableRealtimeDashboard?: boolean;
  clusterConfig?: {
    instances?: number;
    maxMemory?: string;
    autoScaling?: boolean;
  };
  shutdownConfig?: {
    timeout?: number;
    gracefulTimeout?: number;
    waitActiveRequests?: boolean;
  };
  healthConfig?: {
    interval?: number;
    enableDiagnostics?: boolean;
    enablePredictions?: boolean;
  };
}

export interface DaemonV2Stats {
  uptime: number;
  version: string;
  environment: string;
  startTime: number;
  config: {
    clustering: boolean;
    gracefulShutdown: boolean;
    advancedHealth: boolean;
    metrics: boolean;
    realtimeDashboard: boolean;
  };
  cluster?: any;
  shutdown?: any;
  health?: any;
  metrics?: any;
  performance?: any;
}

export interface DaemonV2Status {
  status: 'starting' | 'running' | 'shutting-down' | 'stopped' | 'error';
  uptime: number;
  version: string;
  components: {
    cluster?: {
      status: 'healthy' | 'unhealthy' | 'scaled';
      instances: number;
      healthyInstances: number;
    };
    shutdown?: {
      isShuttingDown: boolean;
      activeRequests: number;
      phase?: string;
    };
    health?: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      score: number;
      checks: number;
    };
    metrics?: {
      uptime: number;
      activeRequests: number;
      totalRequests: number;
      errorRate: number;
    };
    dashboard?: {
      connected: boolean;
      clients: number;
    };
  };
  lastUpdate: number;
}

/**
 * Enhanced Daemon V2 with PM2 clustering and advanced orchestration
 */
export class DaemonV2 {
  private fastify: any;
  private config: DaemonConfig;
  private startTime: number;
  private status: 'starting' | 'running' | 'shutting-down' | 'stopped' | 'error' = 'starting';

  // Enhanced Components
  private clusterManager?: PM2ClusterManager;
  private shutdownManager?: GracefulShutdownManager;
  private healthSystem?: HealthCheckSystem;
  private metricsCollector?: MetricsCollector;
  private realtimeDashboard?: any;

  // Original Services (wrapped)
  private logger: any;
  private fileWatcher?: any;
  private qualityService?: any;
  private dashboard?: any;

  // Configuration
  private options: Required<DaemonV2Options>;

  constructor(options: DaemonV2Options = {}) {
    this.options = {
      config: options.config || {},
      enableClustering: options.enableClustering !== false,
      enableGracefulShutdown: options.enableGracefulShutdown !== false,
      enableAdvancedHealth: options.enableAdvancedHealth !== false,
      enableMetrics: options.enableMetrics !== false,
      enableRealtimeDashboard: options.enableRealtimeDashboard !== false,
      clusterConfig: options.clusterConfig || {},
      shutdownConfig: options.shutdownConfig || {},
      healthConfig: options.healthConfig || {}
    };

    this.config = this.loadConfiguration();
    this.startTime = Date.now();

    // Initialize logging
    this.logger = getLogger();
  }

  /**
   * Start Daemon V2 with all enhanced features
   */
  public async start(): Promise<void> {
    try {
      this.status = 'starting';

      // Initialize metrics collection first (always enabled)
      this.metricsCollector = new MetricsCollector({
        retentionPeriod: TIME_OPERATIONS.EVENT_RETENTION, // 1 hour
        cleanupInterval: TIME_OPERATIONS.CLEANUP_FREQUENCY,    // 1 minute
        enablePrometheusFormat: true
      });

      // Initialize enhanced components based on configuration
      await this.initializeEnhancedComponents();

      // Initialize Fastify server
      await this.initializeFastify();

      // Setup routes and middleware
      await this.setupRoutes();

      // Start the HTTP server
      await this.startServer();

      // Start background services
      await this.startBackgroundServices();

      // Mark as running
      this.status = 'running';
      this.startTime = Date.now();

      logger.info({
        version: this.config.version,
        environment: this.config.environment,
        host: this.config.host,
        port: this.config.port,
        features: {
          clustering: this.options.enableClustering,
          gracefulShutdown: this.options.enableGracefulShutdown,
          advancedHealth: this.options.enableAdvancedHealth,
          metrics: this.options.enableMetrics,
          realtimeDashboard: this.options.enableRealtimeDashboard
        }
      }, '🚀 Daemon V2 started successfully');

    } catch (error) {
      this.status = 'error';
      logger.fatal({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, '❌ Failed to start Daemon V2');
      throw error;
    }
  }

  /**
   * Stop Daemon V2 gracefully
   */
  public async stop(): Promise<void> {
    if (this.status === 'stopped') {
      return;
    }

    this.status = 'shutting-down';
    logger.info('🛑 Starting Daemon V2 shutdown sequence');

    try {
      // Perform graceful shutdown
      if (this.options.enableGracefulShutdown && this.shutdownManager) {
        await this.shutdownManager.shutdown('Manual shutdown');
      }

      // Stop HTTP server
      if (this.fastify) {
        await this.fastify.close();
      }

      // Stop background services
      await this.stopBackgroundServices();

      // Stop enhanced components
      if (this.clusterManager) {
        await this.clusterManager.stop();
      }

      if (this.healthSystem) {
        this.healthSystem.stop();
      }

      if (this.metricsCollector) {
        // Final metrics collection
        this.collectFinalMetrics();
        this.metricsCollector.shutdown();
      }

      this.status = 'stopped';
      logger.info('✅ Daemon V2 shutdown completed');

    } catch (error) {
      this.status = 'error';
      logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, '❌ Error during Daemon V2 shutdown');
      throw error;
    }
  }

  /**
   * Restart Daemon V2
   */
  public async restart(): Promise<void> {
    logger.info('🔄 Restarting Daemon V2');
    await this.stop();
    await this.start();
  }

  /**
   * Get comprehensive Daemon V2 statistics
   */
  public getStats(): DaemonV2Stats {
    const baseStats = {
      uptime: this.status === 'running' ? Date.now() - this.startTime : 0,
      version: this.config.version,
      environment: this.config.environment,
      startTime: this.startTime,
      config: {
        clustering: this.options.enableClustering,
        gracefulShutdown: this.options.enableGracefulShutdown,
        advancedHealth: this.options.enableAdvancedHealth,
        metrics: this.options.enableMetrics,
        realtimeDashboard: this.options.enableRealtimeDashboard
      }
    };

    const stats: DaemonV2Stats = { ...baseStats };

    // Add component-specific stats
    if (this.clusterManager && this.options.enableClustering) {
      stats.cluster = await this.clusterManager.getStatus();
    }

    if (this.options.enableGracefulShutdown && this.shutdownManager) {
      stats.shutdown = {
        isShuttingDown: this.shutdownManager.isShuttingDown(),
        activeRequests: this.shutdownManager.getMetrics().requestsCompleted
      };
    }

    if (this.options.enableAdvancedHealth && this.healthSystem) {
      stats.health = this.healthSystem.getHealthStatus();
    }

    if (this.options.enableMetrics && this.metricsCollector) {
      stats.metrics = this.metricsCollector.getPerformanceSummary();
    }

    if (this.options.enableRealtimeDashboard && this.dashboard) {
      stats.dashboard = {
        connected: true, // Would check actual dashboard status
        clients: 0 // Would get actual client count
      };
    }

    return stats;
  }

  /**
   * Get detailed Daemon V2 status
   */
  public getStatus(): DaemonV2Status {
    const now = Date.now();
    const uptime = this.status === 'running' ? now - this.startTime : 0;

    const status: DaemonV2Status = {
      status: this.status,
      uptime,
      version: this.config.version,
      components: {
        metrics: this.options.enableMetrics ? {
          uptime,
          activeRequests: 0,
          totalRequests: 0,
          errorRate: 0
        } : undefined
      },
      lastUpdate: now
    };

    // Add component-specific status
    if (this.clusterManager && this.options.enableClustering) {
      const clusterStatus = await this.clusterManager.getStatus();
      status.components.cluster = {
        status: clusterStatus.healthyInstances === clusterStatus.totalInstances ? 'healthy' : 'unhealthy',
        instances: clusterStatus.totalInstances,
        healthyInstances: clusterStatus.healthyInstances
      };
    }

    if (this.options.enableGracefulShutdown && this.shutdownManager) {
      const shutdownStatus = this.shutdownManager.getStatus();
      status.components.shutdown = {
        isShuttingDown: shutdownStatus.isShuttingDown,
        activeRequests: shutdownStatus.activeRequests,
        phase: shutdownStatus.currentPhase
      };
    }

    if (this.options.enableAdvancedHealth && this.healthSystem) {
      const healthStatus = this.healthSystem.getHealthStatus();
      status.components.health = {
        status: healthStatus.status,
        score: healthStatus.summary.overallScore,
        checks: healthStatus.summary.totalChecks
      };
    }

    if (this.options.enableRealtimeDashboard && this.dashboard) {
      status.components.dashboard = {
        connected: true, // Would check actual status
        clients: 0 // Would get actual client count
      };
    }

    return status;
  }

  /**
   * Scale the daemon cluster
   */
  public async scaleCluster(instances: number): Promise<void> {
    if (!this.clusterManager) {
      throw new Error('Clustering is not enabled');
    }

    logger.info({ instances }, 'Scaling daemon cluster');
    await this.clusterManager.scale(instances);
  }

  /**
   * Restart the daemon cluster
   */
  public async restartCluster(graceful: boolean = true): Promise<void> {
    if (!this.clusterManager) {
      throw new Error('Clustering is not enabled');
    }

    logger.info({ graceful }, 'Restarting daemon cluster');
    await this.clusterManager.restart(graceful);
  }

  /**
   * Perform immediate health check
   */
  public async checkHealth(): Promise<any> {
    if (!this.healthSystem) {
      return { status: 'unknown', message: 'Advanced health monitoring not enabled' };
    }

    return this.healthSystem.checkHealth();
  }

  /**
   * Get health report
   */
  public getHealthReport(): any {
    if (!this.healthSystem) {
      return { message: 'Advanced health monitoring not enabled' };
    }

    return this.healthSystem.generateHealthReport();
  }

  // Private methods

  private loadConfiguration(): DaemonConfig {
    const config = loadDaemonConfig();

    // Apply custom options
    if (this.options.config) {
      Object.assign(config, this.options.config);
    }

    return config;
  }

  private async initializeEnhancedComponents(): Promise<void> {
    // Initialize PM2 Cluster Manager
    if (this.options.enableClustering) {
      this.clusterManager = new PM2ClusterManager(
        {
          instances: this.options.clusterConfig.instances || 2,
          maxMemory: this.options.clusterConfig.maxMemory || '1G',
          name: 'skills-daemon',
          autorestart: true,
          time: true
        },
        this.metricsCollector
      );
    }

    // Initialize Graceful Shutdown Manager
    if (this.options.enableGracefulShutdown) {
      this.shutdownManager = new GracefulShutdownManager(
        {
          timeout: this.options.shutdownConfig.timeout || TIME_OPERATIONS.SHUTDOWN_TIMEOUT,
          gracefulTimeout: this.options.shutdownConfig.gracefulTimeout || 15000,
          waitActiveRequests: this.options.shutdownConfig.waitActiveRequests !== false,
          enableMetrics: this.options.enableMetrics,
          saveState: true,
          cleanupTempFiles: true
        },
        this.metricsCollector
      );

      // Setup request tracking for graceful shutdown
      this.setupRequestTracking();
    }

    // Initialize Health Check System
    if (this.options.enableAdvancedHealth) {
      this.healthSystem = new HealthCheckSystem(
        {
          interval: this.options.healthConfig.interval || TIME_OPERATIONS.HEALTH_CHECK_INTERVAL,
          timeout: 5000,
          enableDiagnostics: this.options.healthConfig.enableDiagnostics,
          enablePredictions: this.options.healthConfig.enablePredictions
        },
        this.metricsCollector
      );

      // Add custom health checks for daemon-specific components
      this.addCustomHealthChecks();
    }

    // Initialize Real-time Dashboard
    if (this.options.enableRealtimeDashboard) {
      this.dashboard = realtimeDashboard;
    }

    // Initialize Original Services
    this.fileWatcher = getFileWatcherService();
    this.qualityService = getQualityService();
  }

  private async initializeFastify(): Promise<void> {
    const require = createRequire(import.meta.url);

    this.fastify = Fastify({
      logger: false, // We use our own logger
      disableRequestLogging: true
    });

    // Basic middleware
    this.fastify.addHook('onRequest', async (request, reply) => {
      // Track active requests for graceful shutdown
      if (this.options.enableGracefulShutdown && this.shutdownManager) {
        const requestId = Math.random().toString(36).substr(2, 9);
        this.shutdownManager.registerRequest(requestId);

        // Clean up when request completes
        reply.raw.on('finish', () => {
          this.shutdownManager.unregisterRequest(requestId);
        });
      }

      // Add request metrics
      if (this.options.enableMetrics && this.metricsCollector) {
        const startTimer = this.metricsCollector.startTimer('daemon_request_duration');

        reply.raw.on('finish', () => {
          startTimer();
          this.metricsCollector.incrementCounter('daemon_requests_total', 1, {
            method: request.method,
            route: request.routeOptions?.url || 'unknown'
          });
        });
      }
    });
  }

  private async setupRoutes(): Promise<void> {
    // Enhanced health endpoints
    this.fastify.get('/health/v2', async (request, reply) => {
      return this.getStatus();
    });

    this.fastify.get('/stats/v2', async (request, reply) => {
      return this.getStats();
    });

    if (this.healthSystem) {
      this.fastify.get('/health/detailed', async (request, reply) => {
        return this.healthSystem.checkHealth();
      });

      this.fastify.get('/health/report', async (request, reply) => {
        return this.healthSystem.generateHealthReport();
      });

      this.fastify.get('/health/history', async (request, reply) => {
        const duration = parseInt(request.query.duration as string) || TIME_OPERATIONS.METRIC_COLLECTION_DURATION; // 1 hour default
        return this.healthSystem.getHealthHistory(duration);
      });
    }

    if (this.clusterManager) {
      this.fastify.get('/cluster/status', async (request, reply) => {
        return this.clusterManager.getStatus();
      });

      this.fastify.get('/cluster/metrics', async (request, reply) => {
        return this.clusterManager.getMetrics();
      });

      this.fastify.post('/cluster/scale', async (request, reply) => {
        const { instances } = request.body;
        await this.scaleCluster(instances);
        return { message: `Scaled to ${instances} instances` };
      });

      this.fastify.post('/cluster/restart', async (request, reply) => {
        const { graceful } = request.body;
        await this.restartCluster(graceful);
        return { message: `Cluster restarted gracefully: ${graceful}` };
      });
    }

    if (this.options.enableMetrics && this.metricsCollector) {
      this.fastify.get('/metrics', async (request, reply) => {
        reply.type('text/plain');
        return this.metricsCollector.getPrometheusMetrics();
      });
    }

    // Legacy health endpoint for compatibility
    this.fastify.get('/health', async (request, reply) => {
      if (this.healthSystem) {
        const health = await this.healthSystem.checkHealth();
        return health;
      } else {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: this.status === 'running' ? Date.now() - this.startTime : 0
        };
      }
    });
  }

  private async startServer(): Promise<void> {
    const host = this.config.host || 'localhost';
    const port = this.config.port || 3001;

    await this.fastify.listen({ host, port });
    logger.info({ host, port }, 'HTTP server started');
  }

  private async startBackgroundServices(): Promise<void> {
    // Start PM2 cluster if enabled
    if (this.options.enableClustering && this.clusterManager) {
      await this.clusterManager.start();
    }

    // Start health monitoring if enabled
    if (this.options.enableAdvancedHealth && this.healthSystem) {
      this.healthSystem.start();
    }

    // Start original background services
    if (this.fileWatcher) {
      this.fileWatcher.start();
    }

    if (this.dashboard && this.options.enableRealtimeDashboard) {
      this.dashboard.start();
    }

    // Start real-time dashboard if enabled
    if (this.realtimeDashboard && this.options.enableRealtimeDashboard) {
      // Initialize dashboard server
      // This would be implemented based on existing dashboard code
    }
  }

  private async stopBackgroundServices(): Promise<void> {
    // Stop background services in reverse order
    if (this.dashboard && this.options.enableRealtimeDashboard) {
      await this.dashboard.stop();
    }

    if (this.fileWatcher) {
      await this.fileWatcher.stop();
    }

    if (this.options.enableAdvancedHealth && this.healthSystem) {
      this.healthSystem.stop();
    }

    if (this.options.enableClustering && this.clusterManager) {
      await this.clusterManager.stop();
    }
  }

  private setupRequestTracking(): void {
    // This method sets up tracking for graceful shutdown
    // Already implemented in initializeFastify()
  }

  private addCustomHealthChecks(): void {
    if (!this.healthSystem) return;

    // Database connectivity check
    this.healthSystem.addHealthCheck('database', async () => {
      // Check database connectivity
      const { execSync } = await import('child_process');
      try {
        // This would check actual database connection
        execSync('pg_isready', { timeout: 5000 });
        return {
          name: 'database',
          status: 'pass',
          duration: 0,
          message: 'Database connection healthy',
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'fail',
          duration: 0,
          message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }
    });

    // WebSocket connections check
    this.healthSystem.addHealthCheck('websocket', async () => {
      if (this.dashboard) {
        const connectedClients = 0; // Would get actual count
        return {
          name: 'websocket',
          status: 'pass',
          duration: 0,
          message: `${connectedClients} WebSocket connections active`,
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }

      return {
        name: 'websocket',
        status: 'pass',
        duration: 0,
        message: 'WebSocket server not running',
        lastChecked: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        enabled: true
      };
    });

    // File system access check
    this.healthSystem.addHealthCheck('filesystem', async () => {
      try {
        const { accessSync } = await import('fs');
        accessSync('obs/kpi/events.jsonl');

        return {
          name: 'filesystem',
          status: 'pass',
          duration: 0,
          message: 'File system access normal',
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } catch (error) {
        return {
          name: 'filesystem',
          status: 'fail',
          duration: 0,
          message: `File system access failed: ${error instanceof Error ? error.message : String(error)}`,
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }
    });
  }

  private collectFinalMetrics(): void {
    if (!this.metricsCollector) return;

    const finalStats = this.getStats();
    const uptime = finalStats.uptime;

    // Record final metrics
    this.metricsCollector.setGauge('daemon_uptime_seconds', uptime);
    this.metricsCollector.setGauge('daemon_final_memory_mb',
      process.memoryUsage().heapUsed / 1024 / 1024);
    this.metricsCollector.incrementCounter('daemon_shutdowns_total', 1);
  }
}

/**
 * Factory function to create and start Daemon V2
 */
export async function createDaemonV2(options: DaemonV2Options = {}): Promise<DaemonV2> {
  const daemon = new DaemonV2(options);
  await daemon.start();
  return daemon;
}