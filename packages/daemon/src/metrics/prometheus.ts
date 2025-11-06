/**
 * Prometheus Metrics
 * Task: SF-STABILITY-2025-T4.4
 * Date: 2025-11-05
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Skill activation metrics
export const skillActivationTotal = new Counter({
  name: 'skill_activation_total',
  help: 'Total number of skill activations',
  labelNames: ['skill_id', 'status'],
  registers: [register]
});

export const skillActivationDuration = new Histogram({
  name: 'skill_activation_duration_seconds',
  help: 'Duration of skill activation in seconds',
  labelNames: ['skill_id'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Cache metrics
export const cacheHitTotal = new Counter({
  name: 'cache_hit_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheMissTotal = new Counter({
  name: 'cache_miss_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Current size of cache in bytes',
  labelNames: ['cache_type'],
  registers: [register]
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['name'],
  registers: [register]
});

export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['name'],
  registers: [register]
});

// Database metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

// File watcher metrics
export const fileWatcherEvents = new Counter({
  name: 'file_watcher_events_total',
  help: 'Total number of file watcher events',
  labelNames: ['event_type'],
  registers: [register]
});

// Quality service metrics
export const qualityCheckDuration = new Histogram({
  name: 'quality_check_duration_seconds',
  help: 'Duration of quality checks in seconds',
  labelNames: ['check_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const qualityCheckTotal = new Counter({
  name: 'quality_check_total',
  help: 'Total number of quality checks',
  labelNames: ['check_type', 'status'],
  registers: [register]
});

// Error metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'severity'],
  registers: [register]
});

// Health check metrics
export const healthCheckStatus = new Gauge({
  name: 'health_check_status',
  help: 'Health check status (1=healthy, 0=unhealthy)',
  labelNames: ['component'],
  registers: [register]
});

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics content type
 */
export function getMetricsContentType(): string {
  return register.contentType;
}

