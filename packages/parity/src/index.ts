/**
 * Interface Parity Package
 *
 * Comprehensive system for ensuring interface parity between CLI and editor
 * implementations through schema management, validation, testing, and monitoring.
 */

// Schema management
export { SchemaRegistry } from './schemas/index.js';
export type {
  InterfaceSchema,
  PropertyDefinition,
  SchemaValidationResult,
  ValidationError,
  ValidationWarning,
  SchemaRegistryConfig
} from './schemas/index.js';

// Cross-interface validation
export { CrossInterfaceValidator } from './validation/index.js';
export type {
  InterfaceDefinition,
  OperationDefinition,
  ParameterDefinition,
  OperationExample,
  ValidationResult,
  ParityReport,
  CrossValidationConfig
} from './validation/index.js';

// Parity testing
export { ParityTestSuite } from './testing/index.js';
export type {
  TestDefinition,
  TestStep,
  TestExpectation,
  TestExecution,
  StepResult,
  TestIssue,
  TestSuite,
  TestReport,
  ParityTestConfig
} from './testing/index.js';

// Divergence monitoring
export { DivergenceMonitor } from './monitoring/index.js';
export type {
  DivergenceMetrics,
  DivergenceIssue,
  DivergenceAlert,
  MonitoringConfiguration,
  MonitoringReport
} from './monitoring/index.js';

// Main interface parity manager
export { InterfaceParityManager } from './InterfaceParityManager.js';
export type {
  ParityManagerConfig,
  ParityStatus,
  ParityDashboard,
  ParityAlert
} from './InterfaceParityManager.js';