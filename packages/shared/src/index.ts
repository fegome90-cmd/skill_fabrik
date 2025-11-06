/**
 * Shared Utilities Package
 *
 * Common utilities for service management, health checking, and discovery
 */

// Export service registry classes
export {
  ServiceRegistry,
  type ServiceInfo,
  type ServiceMetadata,
  type ServiceRegistration,
  type ServiceQuery,
  type RegistryConfig
} from './service-registry.js';

// Export service discovery classes
export {
  ServiceDiscovery,
  type ServiceDiscoveryConfig,
  type ServiceEndpoint
} from './service-discovery.js';

// Export service discovery server classes
export {
  ServiceDiscoveryServer,
  startDiscoveryServer,
  type DiscoveryServerConfig
} from './service-discovery-server.js';

// Export health checker
export {
  HealthChecker,
  type HealthCheckOptions,
  type HealthCheckResult
} from './health-checker.js';

// Export dependency manager
export {
  ServiceDependencyManager,
  type ServiceDependency,
  type ServiceStatus,
  type DependencyGraph
} from './dependency-manager.js';

// Activation core (shared)
export {
  computeSignals,
  aggregateScore,
  DEFAULT_SIGNAL_WEIGHTS,
  DEFAULT_ACTIVATION_THRESHOLD,
  type SkillRules,
  type SkillRule,
  type SignalScores,
} from './activation/index.js';

export { loadSkillRulesCached } from './activation/rules-loader.js';
