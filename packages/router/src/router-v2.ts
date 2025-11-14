/**
 * Router V2 - Enhanced Orchestration Core
 * Integrates load balancing, advanced caching, circuit breaking, and performance monitoring
 * Task: SF-ORCHESTRATION-2025-V2.0
 * Date: 2025-11-14
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { createRequire } from 'module';

// Enhanced Components
import { LoadBalancer } from './load-balancer/load-balancer.js';
import { MetricsCollector } from './metrics/metrics-collector.js';
import { CircuitBreakerManager } from './circuit-breaker/advanced-circuit-breaker.js';
import { PerformanceMonitor } from './performance/performance-monitor.js';
import { LRUCache } from './cache/lru-cache.js';
import { CacheWarmer } from './cache/cache-warmer.js';

// Original Components
import { healthRoutes } from './health.js';
import { userPromptSubmitHook } from './pre-invoke.js';
import { stopHook } from './stop.js';
import { loadRules, matchRulesFor } from './detectors.js';
import { checkGuardrails } from './guardrails.js';
import {
  validatePreInvoke,
  validateGuardrails,
  validateStop,
  formatValidationErrors,
} from './schemas/validation.js';
import { GracefulShutdown } from './shutdown.js';
import {
  logger,
  requestIdMiddleware,
  requestLoggingMiddleware,
  onResponseLogging,
} from './logger.js';
import { loadConfig, type Config } from './config/config.js';

export interface RouterV2Options {
  config?: Partial<Config>;
  enableLoadBalancer?: boolean;
  enableMetrics?: boolean;
  enableCircuitBreaker?: boolean;
  enablePerformanceMonitor?: boolean;
  enableAdvancedCache?: boolean;
  daemonInstances?: Array<{ id: string; url: string; weight?: number }>;
}

/**
 * Enhanced Router V2 with all performance and reliability improvements
 */
export class RouterV2 {
  private fastify: any;
  private config: Config;
  private gracefulShutdown: GracefulShutdown;

  // Enhanced Components
  private loadBalancer: LoadBalancer | null = null;
  private metrics: MetricsCollector;
  private circuitBreakerManager: CircuitBreakerManager;
  private performanceMonitor: PerformanceMonitor;
  private cache: LRUCache<any>;
  private cacheWarmer: CacheWarmer;

  // Stats
  private startTime = Date.now();

  constructor(private options: RouterV2Options = {}) {
    this.config = this.loadConfiguration();
    this.initializeComponents();
  }

  /**
   * Start the enhanced router service
   */
  public async start(): Promise<void> {
    try {
      // Create Fastify instance
      this.fastify = Fastify({
        logger: false, // We use our own logger
        requestIdHeader: 'x-request-id',
        requestIdLogLabel: 'requestId',
        disableRequestLogging: true,
      });

      // Setup middleware
      await this.setupMiddleware();

      // Setup routes
      await this.setupRoutes();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start listening
      await this.startListening();

      logger.info(
        {
          host: this.config.server.host,
          port: this.config.server.port,
          env: this.config.server.env,
          features: {
            loadBalancer: !!this.loadBalancer,
            metrics: this.options.enableMetrics !== false,
            circuitBreaker: this.options.enableCircuitBreaker !== false,
            performanceMonitor: this.options.enablePerformanceMonitor !== false,
            advancedCache: this.options.enableAdvancedCache !== false
          }
        },
        '🚀 Router V2 started successfully'
      );

    } catch (error) {
      logger.fatal(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        '❌ Failed to start Router V2'
      );
      throw error;
    }
  }

  /**
   * Stop the router service
   */
  public async stop(): Promise<void> {
    logger.info('Shutting down Router V2...');

    // Shutdown components in reverse order
    if (this.cacheWarmer) {
      this.cacheWarmer.shutdown();
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.shutdown();
    }

    if (this.circuitBreakerManager) {
      this.circuitBreakerManager.shutdown();
    }

    if (this.loadBalancer) {
      this.loadBalancer.shutdown();
    }

    if (this.cache) {
      this.cache.destroy();
    }

    // Graceful shutdown
    if (this.gracefulShutdown) {
      await this.gracefulShutdown.shutdown();
    }

    logger.info('Router V2 shutdown completed');
  }

  /**
   * Get comprehensive router statistics
   */
  public getStats(): RouterV2Stats {
    const baseStats = {
      uptime: Date.now() - this.startTime,
      startTime: this.startTime,
      version: '2.0.0',
      environment: this.config.server.env
    };

    const stats: RouterV2Stats = {
      ...baseStats,
      config: {
        loadBalancing: this.config.daemon.enabled,
        metricsEnabled: this.options.enableMetrics !== false,
        circuitBreakerEnabled: this.options.enableCircuitBreaker !== false,
        performanceMonitoringEnabled: this.options.enablePerformanceMonitor !== false,
        advancedCacheEnabled: this.options.enableAdvancedCache !== false
      }
    };

    // Add component-specific stats
    if (this.loadBalancer) {
      stats.loadBalancer = this.loadBalancer.getStats();
    }

    if (this.options.enableMetrics !== false) {
      stats.metrics = this.metrics.getPerformanceSummary();
    }

    if (this.options.enableCircuitBreaker !== false) {
      stats.circuitBreakers = this.circuitBreakerManager.getAllStats();
    }

    if (this.options.enablePerformanceMonitor !== false) {
      stats.performance = this.performanceMonitor.getReport();
    }

    if (this.cache) {
      stats.cache = this.cache.getStats();
    }

    return stats;
  }

  /**
   * Get health status with detailed component information
   */
  public getHealthStatus(): EnhancedHealthStatus {
    const now = Date.now();
    const uptime = now - this.startTime;

    const health: EnhancedHealthStatus = {
      status: 'healthy',
      timestamp: now,
      uptime,
      version: '2.0.0',
      environment: this.config.server.env,
      components: {}
    };

    // Check each component
    if (this.loadBalancer) {
      const lbStats = this.loadBalancer.getStats();
      health.components.loadBalancer = {
        status: lbStats.healthyInstances > 0 ? 'healthy' : 'unhealthy',
        details: lbStats
      };
    }

    if (this.options.enablePerformanceMonitor !== false) {
      const perfReport = this.performanceMonitor.getReport();
      const criticalAlerts = perfReport.alerts.filter(a => a.severity === 'critical');

      health.components.performanceMonitor = {
        status: criticalAlerts.length > 0 ? 'degraded' : 'healthy',
        details: perfReport
      };
    }

    if (this.cache) {
      const cacheStats = this.cache.getStats();
      health.components.cache = {
        status: cacheStats.hitRate > 0.5 ? 'healthy' : 'degraded',
        details: cacheStats
      };
    }

    // Overall status
    const unhealthyComponents = Object.values(health.components)
      .filter(comp => comp.status === 'unhealthy').length;

    if (unhealthyComponents > 0) {
      health.status = 'unhealthy';
    } else if (Object.values(health.components).some(comp => comp.status === 'degraded')) {
      health.status = 'degraded';
    }

    return health;
  }

  // Private methods

  private loadConfiguration(): Config {
    const config = loadConfig();

    // Apply custom options
    if (this.options.config) {
      Object.assign(config, this.options.config);
    }

    return config;
  }

  private initializeComponents(): void {
    // Initialize metrics collection (always enabled)
    this.metrics = new MetricsCollector({
      retentionPeriod: 3600000, // 1 hour
      cleanupInterval: 60000,    // 1 minute
      enablePrometheusFormat: true
    });

    // Initialize advanced cache
    if (this.options.enableAdvancedCache !== false) {
      this.cache = new LRUCache<any>({
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        cleanupInterval: 60000
      });

      this.cacheWarmer = new CacheWarmer(
        this.cache,
        this.metrics,
        {
          warmupInterval: 300000, // 5 minutes
          preloadRules: true,
          preloadCommonSkills: true,
          maxConcurrentWarmups: 3,
          adaptiveWarming: true
        }
      );
    }

    // Initialize circuit breaker manager
    if (this.options.enableCircuitBreaker !== false) {
      this.circuitBreakerManager = new CircuitBreakerManager(this.metrics);
    }

    // Initialize performance monitor
    if (this.options.enablePerformanceMonitor !== false) {
      this.performanceMonitor = new PerformanceMonitor(
        this.metrics,
        {
          checkInterval: 10000, // 10 seconds
          enablePredictions: true,
          enableAutoTuning: false
        }
      );

      // Set up performance alerts
      this.setupPerformanceAlerts();
    }

    // Initialize load balancer
    if (this.options.enableLoadBalancer !== false && this.config.daemon.enabled) {
      const daemonInstances = this.options.daemonInstances || [
        {
          id: 'daemon-1',
          url: this.config.daemon.url,
          weight: 1,
          maxConnections: 100
        }
      ];

      this.loadBalancer = new LoadBalancer({
        daemonInstances,
        healthCheckInterval: this.config.daemon.healthCheckInterval,
        strategy: 'weighted-round-robin',
        circuitBreakerThreshold: 5
      });
    }
  }

  private async setupMiddleware(): Promise<void> {
    const fastify = this.fastify;
    const require = createRequire(import.meta.url);

    // Request ID middleware
    fastify.addHook('onRequest', requestIdMiddleware());
    fastify.addHook('onRequest', requestLoggingMiddleware());
    fastify.addHook('onSend', onResponseLogging);

    // Rate limiting
    const rateLimitPkg = require('@fastify/rate-limit/package.json');
    const rateLimitMajor = Number(String(rateLimitPkg.version).split('.')[0] || '0');
    const fastifyMajor = Number(fastify.version?.split?.('.')?.[0] ?? '0');

    if (fastifyMajor >= 5 && rateLimitMajor >= 11) {
      try {
        await fastify.register(rateLimit, {
          max: this.config.rateLimit.max,
          timeWindow: this.config.rateLimit.timeWindow,
          cache: 10000,
          allowList: ['127.0.0.1', '::1'],
          skipOnError: true,
          errorResponseBuilder: () => ({
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            statusCode: 429,
          }),
        });
      } catch (error) {
        logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Skipping rate limit plugin');
      }
    }

    // Compression
    if (fastifyMajor >= 5 && this.config.compression.enabled) {
      await fastify.register(compress, {
        global: true,
        threshold: this.config.compression.threshold,
        encodings: ['gzip', 'deflate'],
        zlibOptions: {
          level: this.config.compression.level,
        },
      });
    }

    // Metrics middleware
    if (this.options.enableMetrics !== false) {
      fastify.addHook('onRequest', async (request: any, reply: any) => {
        const startTimer = this.metrics.startTimer('router_request_duration');

        // Store timer for completion
        reply.startTime = Date.now();
        reply.startTimer = startTimer;
      });

      fastify.addHook('onResponse', async (request: any, reply: any) => {
        const duration = reply.startTimer ? reply.startTimer() : Date.now() - reply.startTime;
        const labels = {
          method: request.method,
          statusCode: reply.statusCode.toString(),
          route: request.routeOptions?.url || 'unknown'
        };

        this.metrics.incrementCounter('router_requests_total', 1, labels);

        if (reply.statusCode >= 400) {
          this.metrics.incrementCounter('router_errors_total', 1, labels);
        }
      });
    }
  }

  private async setupRoutes(): Promise<void> {
    const fastify = this.fastify;

    // Health endpoints
    await fastify.register(healthRoutes);

    // Enhanced health endpoint with detailed status
    fastify.get('/health/v2', async (request: any, reply: any) => {
      return this.getHealthStatus();
    });

    // Router V2 stats endpoint
    fastify.get('/stats/v2', async (request: any, reply: any) => {
      return this.getStats();
    });

    // Metrics endpoint (Prometheus format)
    if (this.options.enableMetrics !== false) {
      fastify.get('/metrics', async (request: any, reply: any) => {
        reply.type('text/plain');
        return this.metrics.getPrometheusMetrics();
      });
    }

    // Load balancer status endpoint
    if (this.loadBalancer) {
      fastify.get('/load-balancer/status', async (request: any, reply: any) => {
        return {
          stats: this.loadBalancer.getStats(),
          instances: this.loadBalancer.getInstanceStatus()
        };
      });

      fastify.post('/load-balancer/strategy/:strategy', async (request: any, reply: any) => {
        const { strategy } = request.params;
        const validStrategies = ['round-robin', 'weighted-round-robin', 'least-connections', 'response-time'];

        if (!validStrategies.includes(strategy)) {
          return reply.code(400).send({
            error: 'Invalid strategy',
            validStrategies
          });
        }

        this.loadBalancer.updateStrategy(strategy);
        return { message: `Strategy updated to ${strategy}` };
      });
    }

    // Performance monitoring endpoints
    if (this.options.enablePerformanceMonitor !== false) {
      fastify.get('/performance/report', async (request: any, reply: any) => {
        return this.performanceMonitor.getReport();
      });

      fastify.get('/performance/alerts', async (request: any, reply: any) => {
        return this.performanceMonitor.getAlerts();
      });

      fastify.post('/performance/alerts/:alertId/resolve', async (request: any, reply: any) => {
        const { alertId } = request.params;
        const { reason } = request.body || {};

        this.performanceMonitor.resolveAlert(alertId, reason);
        return { message: `Alert ${alertId} resolved` };
      });

      fastify.get('/performance/predictions', async (request: any, reply: any) => {
        return this.performanceMonitor.generatePredictions();
      });
    }

    // Original routes with enhanced protection
    await this.setupOriginalRoutes();
  }

  private async setupOriginalRoutes(): Promise<void> {
    const fastify = this.fastify;

    // Pre-invoke hook with circuit breaker protection
    fastify.post('/invoke', {
      schema: {
        body: {
          type: 'object',
          required: ['input'],
          properties: {
            input: { type: 'string' },
            context: { type: 'object' }
          }
        }
      }
    }, async (request: any, reply: any) => {
      const circuitBreaker = this.circuitBreakerManager.getBreaker('invoke', {
        failureThreshold: 5,
        resetTimeout: 30000,
        timeoutMs: this.config.daemon.timeout
      });

      return circuitBreaker.execute(async () => {
        return userPromptSubmitHook(request, reply);
      });
    });

    // Enhanced guardrails with caching
    fastify.post('/guardrails', async (request: any, reply: any) => {
      if (!validateGuardrails(request.body)) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: formatValidationErrors(validateGuardrails.errors),
        });
      }

      // Check cache first
      const cacheKey = `guardrails-${JSON.stringify(request.body).slice(0, 100)}`;
      if (this.cache && this.cache.has(cacheKey)) {
        this.metrics.incrementCounter('guardrails_cache_hits');
        return this.cache.get(cacheKey);
      }

      const result = await checkGuardrails(request.body.editLog, request.body.cwd || process.cwd());

      // Cache result
      if (this.cache) {
        this.cache.set(cacheKey, { success: true, result }, 300000); // 5 minutes
      }

      this.metrics.incrementCounter('guardrails_cache_misses');
      return { success: true, result };
    });

    // Rules matching with enhanced caching
    fastify.post('/match-rules', async (request: any, reply: any) => {
      const circuitBreaker = this.circuitBreakerManager.getBreaker('match-rules', {
        failureThreshold: 3,
        resetTimeout: 15000
      });

      return circuitBreaker.execute(async () => {
        // Check cache first
        const cacheKey = `rules-match-${request.body.input.slice(0, 50)}`;
        if (this.cache && this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }

        const rules = await loadRules();
        const matches = await matchRulesFor(request.body.input, rules);

        const result = { success: true, matches };

        // Cache result
        if (this.cache) {
          this.cache.set(cacheKey, result, 600000); // 10 minutes
        }

        return result;
      });
    });

    // Stop hook with circuit breaker
    fastify.post('/stop', async (request: any, reply: any) => {
      const circuitBreaker = this.circuitBreakerManager.getBreaker('stop');

      return circuitBreaker.execute(async () => {
        return stopHook(request, reply);
      });
    });
  }

  private setupGracefulShutdown(): void {
    this.gracefulShutdown = new GracefulShutdown(this.fastify, {
      timeout: 30000,
      logger: logger,
    });

    // Enhanced readiness check
    this.fastify.get('/health/ready', async (request: any, reply: any) => {
      if (!this.gracefulShutdown.isHealthy()) {
        return reply.code(503).send({
          status: 'shutting_down',
          timestamp: new Date().toISOString(),
        });
      }

      return this.getHealthStatus();
    });
  }

  private async startListening(): Promise<void> {
    await this.fastify.listen({
      port: this.config.server.port,
      host: this.config.server.host,
    });

    // Signal PM2 that server is ready
    if (process.send) {
      process.send('ready');
    }
  }

  private setupPerformanceAlerts(): void {
    // Response time alerts
    this.performanceMonitor.addThreshold(
      'high_response_time',
      'averageResponseTime',
      'gt',
      2000,
      'medium',
      { duration: 60000, cooldown: 300000 }
    );

    // Error rate alerts
    this.performanceMonitor.addThreshold(
      'high_error_rate',
      'errorRate',
      'gt',
      5,
      'high',
      { duration: 30000, cooldown: 180000 }
    );

    // Memory usage alerts
    this.performanceMonitor.addThreshold(
      'high_memory_usage',
      'memoryUsage.heapUsed',
      'gt',
      512 * 1024 * 1024, // 512MB
      'medium',
      { duration: 120000, cooldown: 600000 }
    );
  }
}

// Type definitions
export interface RouterV2Stats {
  uptime: number;
  startTime: number;
  version: string;
  environment: string;
  config: {
    loadBalancing: boolean;
    metricsEnabled: boolean;
    circuitBreakerEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    advancedCacheEnabled: boolean;
  };
  loadBalancer?: any;
  metrics?: any;
  circuitBreakers?: any;
  performance?: any;
  cache?: any;
}

export interface EnhancedHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  version: string;
  environment: string;
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: any;
    };
  };
}

/**
 * Factory function to create and start Router V2
 */
export async function createRouterV2(options: RouterV2Options = {}): Promise<RouterV2> {
  const router = new RouterV2(options);
  await router.start();
  return router;
}