// Cache system
export {
  SignalCache,
  type CacheEntry,
  type CacheConfig,
  type CacheKey,
  type CacheMetrics
} from './cache/SignalCache.js';

// Cache warming
export {
  CacheWarmer,
  type WarmingStrategy,
  type PrecomputedWarmingConfig,
  type PredictiveWarmingConfig,
  type PeriodicWarmingConfig,
  type WarmingMetrics
} from './warming/CacheWarmer.js';

// Cache invalidation
export {
  CacheInvalidator,
  type InvalidationRule,
  type InvalidationTrigger,
  type InvalidationFilter,
  type InvalidationAction,
  type InvalidationResult,
  type InvalidationMetrics
} from './invalidation/CacheInvalidator.js';

// Redis integration
export {
  RedisL2Adapter,
  type RedisL2AdapterConfig,
  type RedisHealthStatus,
  type RedisMetrics
} from './integration/RedisL2Adapter.js';

// Metrics collection
export {
  CacheMetricsCollector,
  type MetricsCollectorConfig,
  type AggregatedMetrics,
  type MetricsAlert,
  type PrometheusMetrics
} from './monitoring/CacheMetricsCollector.js';

// Re-export activation types for convenience
export type {
  ActivationWeights,
  ActivationSignals,
  ScoreInput
} from '../../router/src/activation/types.js';